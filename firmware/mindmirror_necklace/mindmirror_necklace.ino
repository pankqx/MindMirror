// MindMirror Necklace: hold the button, talk, let go, hear the reply from the necklace.
//
// Board: ESP32 Dev Module (ESP32-WROOM-32 DevKit). Arduino IDE, "esp32 by Espressif" core 3.x.
// Parts: INMP441 mic (I2S in), MAX98357A amp (I2S out) + 8 ohm speaker, push button.
//
// Flow: button down -> stream mic audio to the laptop hub over Wi-Fi (HTTP, chunked)
//       button up   -> hub transcribes, writes a reply, makes speech -> we play it.

#include <WiFi.h>
#include <WiFiUdp.h>
#include <freertos/stream_buffer.h>
#include "ESP_I2S.h"
#include "config.h"

I2SClass mic;
I2SClass amp;
WiFiUDP udp;

IPAddress hubIp;
uint16_t hubPort = HUB_PORT;
bool hubKnown = false;

// ---------- status LED (runs in its own task) ----------

enum LedMode { LED_OFF, LED_READY, LED_LISTEN, LED_THINK, LED_WIFI };
volatile LedMode ledMode = LED_WIFI;

void ledTask(void *) {
  bool on = false;
  for (;;) {
    switch (ledMode) {
      case LED_OFF:    digitalWrite(PIN_LED, LOW);  delay(50); break;
      case LED_READY:  digitalWrite(PIN_LED, HIGH); delay(50); break;            // solid: ready
      case LED_LISTEN: on = !on; digitalWrite(PIN_LED, on); delay(80); break;    // fast blink: listening
      case LED_THINK:  digitalWrite(PIN_LED, HIGH); delay(60);                    // blip: thinking/speaking
                       digitalWrite(PIN_LED, LOW); delay(440); break;
      case LED_WIFI:   on = !on; digitalWrite(PIN_LED, on); delay(500); break;   // slow blink: no Wi-Fi
    }
  }
}

// ---------- speaker ----------

static int16_t stereo[512 * 2];

// Plays mono 16-bit samples. The amp gets the same sample on left and right.
void playMono(const int16_t *s, size_t n) {
  while (n) {
    size_t k = n < 512 ? n : 512;
    for (size_t i = 0; i < k; i++) {
      int16_t v = (int16_t)(s[i] * VOLUME);
      stereo[2 * i] = v;
      stereo[2 * i + 1] = v;
    }
    amp.write((uint8_t *)stereo, k * 4);
    s += k;
    n -= k;
  }
}

void playSilence(int ms) {
  static int16_t zeros[256] = {0};
  int n = SAMPLE_RATE * ms / 1000;
  while (n > 0) { playMono(zeros, n < 256 ? n : 256); n -= 256; }
}

void playTone(float hz, int ms, float level = 0.25f) {
  static int16_t buf[256];
  int total = SAMPLE_RATE * ms / 1000;
  float phase = 0, step = 2 * PI * hz / SAMPLE_RATE;
  for (int done = 0; done < total;) {
    int k = min(256, total - done);
    for (int i = 0; i < k; i++) {
      float fade = min(1.0f, min((done + i) / 160.0f, (total - done - i) / 160.0f));  // no clicks
      buf[i] = (int16_t)(sinf(phase) * 32767 * level * fade);
      phase += step;
    }
    playMono(buf, k);
    done += k;
  }
}

void beepReady()  { playTone(660, 100); playTone(880, 140); playSilence(60); }
void beepListen() { playTone(880, 70); playSilence(30); }
void beepError()  { playTone(440, 180); playTone(330, 260); playSilence(60); }

// ---------- microphone (its own task, so Wi-Fi hiccups don't drop audio) ----------

StreamBufferHandle_t micStream;
volatile bool recording = false;

void micTask(void *) {
  static int32_t raw[256 * 2];  // 256 stereo frames of 32-bit
  static int16_t pcm[256];
  float prevIn = 0, prevOut = 0;
  for (;;) {
    size_t got = mic.readBytes((char *)raw, sizeof(raw));
    if (!recording) { prevIn = prevOut = 0; continue; }
    size_t frames = got / 8;
    for (size_t i = 0; i < frames; i++) {
      float x = (float)(raw[2 * i + MIC_CHANNEL] >> MIC_SHIFT);
      float y = x - prevIn + 0.995f * prevOut;  // removes the mic's DC offset
      prevIn = x;
      prevOut = y;
      pcm[i] = (int16_t)constrain(y, -32768.0f, 32767.0f);
    }
    xStreamBufferSend(micStream, pcm, frames * 2, 0);  // if full, drop rather than block
  }
}

// ---------- finding the hub ----------

void checkBeacon() {
  if (strlen(HUB_HOST)) return;
  int size = udp.parsePacket();
  if (!size) return;
  char b[48];
  int n = udp.read(b, sizeof(b) - 1);
  if (n <= 0) return;
  b[n] = 0;
  if (strncmp(b, "MINDMIRROR_HUB ", 15) == 0) {
    IPAddress ip = udp.remoteIP();
    uint16_t port = atoi(b + 15);
    if (!hubKnown || ip != hubIp) Serial.printf("Hub found at %s:%u\n", ip.toString().c_str(), port);
    hubIp = ip;
    hubPort = port;
    hubKnown = true;
  }
}

bool waitForHub(uint32_t ms) {
  uint32_t t = millis();
  while (!hubKnown && millis() - t < ms) { checkBeacon(); delay(20); }
  return hubKnown;
}

// ---------- HTTP helpers ----------

bool writeAll(WiFiClient &c, const uint8_t *p, size_t n) {
  while (n) {
    size_t w = c.write(p, n);
    if (w == 0) return false;
    p += w;
    n -= w;
  }
  return true;
}

bool readLine(WiFiClient &c, String &line, uint32_t timeoutMs) {
  line = "";
  uint32_t t = millis();
  while (millis() - t < timeoutMs) {
    while (c.available()) {
      char ch = c.read();
      if (ch == '\n') { line.trim(); return true; }
      line += ch;
    }
    if (!c.connected()) return line.length() > 0;
    delay(2);
  }
  return false;
}

// ---------- one conversation turn ----------

void talk() {
  if (!waitForHub(2500)) {
    Serial.println("No hub. Is server.mjs running on the laptop, on the same hotspot?");
    beepError();
    return;
  }

  WiFiClient c;
  if (!c.connect(hubIp, hubPort, 3000)) {
    Serial.printf("Can't reach hub at %s:%u (laptop firewall?)\n", hubIp.toString().c_str(), hubPort);
    if (!strlen(HUB_HOST)) hubKnown = false;  // listen for the beacon again
    beepError();
    return;
  }
  c.setNoDelay(true);
  c.printf("POST /talk?src=necklace HTTP/1.1\r\nHost: %s\r\n"
           "Content-Type: audio/L16; rate=16000\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n",
           hubIp.toString().c_str());

  beepListen();
  xStreamBufferReset(micStream);
  recording = true;
  ledMode = LED_LISTEN;
  Serial.println("Listening...");

  alignas(4) static uint8_t chunk[8 + 2048 + 2];
  uint32_t start = millis();
  size_t sent = 0;
  bool ok = true;
  while (ok) {
    bool held = digitalRead(PIN_BUTTON) == LOW && millis() - start < MAX_RECORD_SECONDS * 1000UL;
    if (!held) recording = false;
    size_t n = xStreamBufferReceive(micStream, chunk + 8, 2048, pdMS_TO_TICKS(30));
    if (n) {
      // HTTP chunk: "<hex length>\r\n<data>\r\n", built in one buffer so it goes out as one write
      char hdr[8];
      int h = snprintf(hdr, sizeof(hdr), "%X\r\n", (unsigned)n);
      uint8_t *p = chunk + 8 - h;
      memcpy(p, hdr, h);
      chunk[8 + n] = '\r';
      chunk[8 + n + 1] = '\n';
      ok = writeAll(c, p, h + n + 2);
      sent += n;
    } else if (!held) {
      break;  // button released and the buffer is empty
    }
  }
  recording = false;
  if (ok) ok = writeAll(c, (const uint8_t *)"0\r\n\r\n", 5);
  Serial.printf("Sent %.1f s of audio\n", sent / 32000.0f);
  if (!ok) { beepError(); ledMode = LED_READY; return; }

  // ---- reply ----
  ledMode = LED_THINK;
  String line;
  if (!readLine(c, line, 25000)) { Serial.println("Hub took too long"); beepError(); ledMode = LED_READY; return; }
  int status = line.length() > 12 ? line.substring(9, 12).toInt() : 0;
  long length = -1;
  while (readLine(c, line, 3000) && line.length()) {
    if (line.startsWith("Content-Length:") || line.startsWith("content-length:")) length = line.substring(15).toInt();
  }
  if (status != 200) {
    Serial.printf("Hub said %d\n", status);
    if (status == 422) playTone(500, 150);  // too short: one soft beep, try again
    else beepError();
    ledMode = LED_READY;
    return;
  }

  alignas(4) static uint8_t buf[2048 + 1];
  size_t carry = 0;  // an odd leftover byte from the previous read
  long got = 0;
  uint32_t last = millis();
  while ((length < 0 || got < length) && millis() - last < 5000) {
    int avail = c.available();
    if (avail <= 0) {
      if (!c.connected()) break;
      delay(1);
      continue;
    }
    int n = c.read(buf + carry, min(avail, 2048));
    if (n <= 0) continue;
    last = millis();
    got += n;
    size_t total = carry + n;
    playMono((int16_t *)buf, total / 2);
    carry = total & 1;
    if (carry) buf[0] = buf[total - 1];
  }
  playSilence(80);
  Serial.printf("Played %.1f s of reply\n", got / 32000.0f);
  c.stop();
  ledMode = LED_READY;
}

// ---------- setup / loop ----------

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  xTaskCreate(ledTask, "led", 2048, nullptr, 1, nullptr);

  amp.setPins(PIN_AMP_BCLK, PIN_AMP_LRC, PIN_AMP_DIN);
  if (!amp.begin(I2S_MODE_STD, SAMPLE_RATE, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO)) Serial.println("Amp I2S failed");
  mic.setPins(PIN_MIC_SCK, PIN_MIC_WS, -1, PIN_MIC_SD);
  if (!mic.begin(I2S_MODE_STD, SAMPLE_RATE, I2S_DATA_BIT_WIDTH_32BIT, I2S_SLOT_MODE_STEREO)) Serial.println("Mic I2S failed");

  micStream = xStreamBufferCreate(32000, 1);  // 1 second of audio
  xTaskCreate(micTask, "mic", 4096, nullptr, 5, nullptr);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);  // faster replies, and we don't miss the hub's beacon
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("Connecting to %s", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.printf("\nWi-Fi OK, my IP %s\n", WiFi.localIP().toString().c_str());

  if (strlen(HUB_HOST)) { hubIp.fromString(HUB_HOST); hubKnown = true; }
  udp.begin(BEACON_PORT);
  waitForHub(4000);
  ledMode = LED_READY;
  beepReady();
  Serial.println("Ready. Hold the button and talk.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { ledMode = LED_WIFI; delay(200); return; }
  if (ledMode == LED_WIFI) ledMode = LED_READY;
  checkBeacon();
  if (digitalRead(PIN_BUTTON) == LOW) {
    delay(30);  // debounce
    if (digitalRead(PIN_BUTTON) == LOW) {
      talk();
      while (digitalRead(PIN_BUTTON) == LOW) delay(10);  // wait for release if it was a long hold
    }
  }
  delay(5);
}
