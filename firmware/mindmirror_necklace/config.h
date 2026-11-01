// MindMirror Necklace settings. This is the only file you should need to edit.
#pragma once

// ---- Wi-Fi: your phone hotspot, set to 2.4 GHz (the ESP32 can't see 5 GHz) ----
#define WIFI_SSID "MindMirror"
#define WIFI_PASS "mindmirror123"

// ---- Hub (the laptop running hub/server.mjs) ----
// Leave HUB_HOST empty ("") and the necklace finds the laptop by itself (UDP beacon).
// If that fails, type the laptop IP the hub prints, for example "192.168.43.120".
#define HUB_HOST ""
#define HUB_PORT 8787
#define BEACON_PORT 8788

// ---- Pins (ESP32 DevKit, ESP32-WROOM-32). Use the labels printed on the board. ----
#define PIN_MIC_SCK 32   // INMP441 SCK
#define PIN_MIC_WS 25    // INMP441 WS
#define PIN_MIC_SD 33    // INMP441 SD
#define PIN_AMP_BCLK 26  // MAX98357A BCLK
#define PIN_AMP_LRC 27   // MAX98357A LRC
#define PIN_AMP_DIN 22   // MAX98357A DIN
#define PIN_BUTTON 13    // push button to GND
#define PIN_LED 2        // blue LED on the DevKit

// ---- Audio ----
#define SAMPLE_RATE 16000
#define MIC_CHANNEL 0       // 0 or 1: run sketch 03_mic_level and use the side that moves when you talk
#define MIC_SHIFT 14        // 32-bit mic sample >> this = 16-bit. Smaller = louder (12 to 16)
#define VOLUME 0.5f         // 0.0 to 1.0. Keep at 0.5 or below with VIN on 5V: the speaker is only 0.5 W
#define MAX_RECORD_SECONDS 10
