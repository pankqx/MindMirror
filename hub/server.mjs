// MindMirror Hub: runs on the laptop. The necklace and the web app both talk to it.
//
//   POST /talk     audio in (necklace: raw 16 kHz 16-bit mono PCM, web: webm/wav)
//                  -> transcribe (Groq Whisper) -> companion reply (Groq LLM) -> speech (Edge TTS)
//                  -> audio out (necklace: raw 16 kHz PCM, web: mp3)
//   POST /chat     {"text": "..."} -> {"reply", "mood", "signals"} for the app's chat screen
//   GET  /events   Server-Sent Events: every voice turn, so the app can log it
//   GET  /health   quick check
//
// It also shouts "MINDMIRROR_HUB <port>" on UDP broadcast every 2 s so the necklace finds
// the laptop without anyone typing an IP address.
//
// Run:  node --env-file=.env server.mjs

import http from "node:http";
import dgram from "node:dgram";
import os from "node:os";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const PORT = Number(process.env.PORT || 8787);
const BEACON_PORT = 8788;
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const STT_MODEL = process.env.STT_MODEL || "whisper-large-v3-turbo";
const CHAT_MODEL = process.env.CHAT_MODEL || "openai/gpt-oss-20b";
const VOICE = process.env.TTS_VOICE || "en-IN-NeerjaNeural";
const MOCK = process.env.MOCK_AI === "1"; // no internet needed: fixed transcript and reply
const RATE = 16000;

// ---------- safety ----------

const CRISIS = [
  "kill myself", "suicide", "suicidal", "end my life", "want to die", "self harm", "self-harm",
  "hurt myself", "cut myself", "no reason to live", "better off without me", "end it all",
];
const CRISIS_REPLY =
  "I'm really glad you told me. You deserve support right now. Please call Tele MANAS on 1 4 4 1 6, " +
  "it's free and open all day and night, or 1 1 2 if you are in danger. Can you also tell someone near you?";

const isCrisis = (t) => CRISIS.some((w) => t.toLowerCase().includes(w));

const SYSTEM = `You are MindMirror, a warm, calm well-being companion for college students in India.
You help a student notice early signs of stress and burnout. You never diagnose, never name a disorder,
never give medical advice. Reply in at most 2 short spoken sentences (under 40 words), plain words,
no lists, no emojis. Reflect what you heard, then offer one small, doable next step.
Return ONLY JSON: {"reply": string, "mood": "good"|"okay"|"low"|"stressed"|"tired",
"signals": array of zero or more of "sleep","pressure","isolation","energy","motivation"}.`;

// ---------- AI calls ----------

async function transcribe(audio, filename, type) {
  if (MOCK) return "I slept only four hours and I have two assignments due tomorrow.";
  const form = new FormData();
  form.append("model", STT_MODEL);
  form.append("language", "en");
  form.append("response_format", "json");
  form.append("file", new Blob([audio], { type }), filename);
  const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}` },
    body: form,
  });
  if (!r.ok) throw new Error(`transcribe ${r.status}: ${await r.text()}`);
  return ((await r.json()).text || "").trim();
}

async function companion(text, context = "") {
  if (isCrisis(text)) return { reply: CRISIS_REPLY, mood: "low", signals: [], crisis: true };
  if (MOCK) {
    return {
      reply: "That sounds like a heavy night and a heavy day. Could you pick the one assignment that matters most and start with twenty minutes?",
      mood: "stressed", signals: ["sleep", "pressure"],
    };
  }
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.6,
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM + (context ? `\nWhat the app knows (use gently): ${context}` : "") },
        { role: "user", content: text },
      ],
    }),
  });
  if (!r.ok) throw new Error(`chat ${r.status}: ${await r.text()}`);
  const content = (await r.json()).choices?.[0]?.message?.content || "";
  return parseReply(content);
}

export function parseReply(content) {
  const m = content.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m ? m[0] : content);
    return {
      reply: String(j.reply || "").slice(0, 400) || "I'm here with you. Tell me a little more?",
      mood: ["good", "okay", "low", "stressed", "tired"].includes(j.mood) ? j.mood : "okay",
      signals: Array.isArray(j.signals) ? j.signals.filter((s) => typeof s === "string") : [],
    };
  } catch {
    return { reply: content.trim().slice(0, 400) || "I'm here with you.", mood: "okay", signals: [] };
  }
}

async function speakMp3(text) {
  if (MOCK) return toMp3FromTone();
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const safe = text.replace(/[<>&"']/g, " ");
  const { audioStream } = tts.toStream(safe, { rate: "-5%" });
  const chunks = [];
  for await (const c of audioStream) chunks.push(c);
  tts.close();
  return Buffer.concat(chunks);
}

// ---------- audio helpers ----------

function ffmpeg(args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", ...args]);
    const out = [];
    let err = "";
    p.stdout.on("data", (d) => out.push(d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(err))));
    p.stdin.end(input);
  });
}

// mp3 -> raw signed 16-bit little-endian, 16 kHz, mono (what the necklace plays)
const mp3ToPcm = (mp3) => ffmpeg(["-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", String(RATE), "pipe:1"], mp3);

// MOCK mode only: a soft 440 Hz tone so the full path can be tested without internet
const toMp3FromTone = () =>
  ffmpeg(["-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-f", "mp3", "pipe:1"], Buffer.alloc(0));

export function pcmToWav(pcm, rate = RATE) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// ---------- events to the web app ----------

const listeners = new Set();
function broadcast(event) {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of listeners) res.write(line);
}

// ---------- HTTP ----------

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body, type = "application/json") {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
  res.writeHead(status, { "Content-Type": type, "Content-Length": buf.length, Connection: "close" });
  res.end(buf);
}

async function handleTalk(req, res, url) {
  const t0 = Date.now();
  const fromNecklace = url.searchParams.get("src") !== "web";
  const body = await readBody(req);
  const type = (req.headers["content-type"] || "").split(";")[0];

  let audio, name, mime;
  if (fromNecklace || type === "audio/l16") {
    if (body.length < RATE * 2 * 0.4) throw Object.assign(new Error("too short"), { short: true });
    audio = pcmToWav(body); name = "speech.wav"; mime = "audio/wav";
  } else {
    audio = body; name = type.includes("wav") ? "speech.wav" : "speech.webm"; mime = type || "audio/webm";
  }

  const heard = await transcribe(audio, name, mime);
  const t1 = Date.now();
  const out = heard ? await companion(heard) : { reply: "I couldn't hear that. Hold the button and try again?", mood: "okay", signals: [] };
  const t2 = Date.now();
  const mp3 = await speakMp3(out.reply);
  const t3 = Date.now();

  broadcast({ type: "turn", at: new Date().toISOString(), source: fromNecklace ? "necklace" : "web", heard, ...out });
  console.log(`[talk] ${(body.length / 32000).toFixed(1)}s audio | stt ${t1 - t0}ms, ai ${t2 - t1}ms, tts ${t3 - t2}ms`);
  console.log(`  heard: ${heard}\n  reply: ${out.reply}`);

  if (fromNecklace) send(res, 200, await mp3ToPcm(mp3), "audio/L16; rate=16000; channels=1");
  else send(res, 200, mp3, "audio/mpeg");
}

function broadcastAddresses() {
  const out = new Set(["255.255.255.255"]);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      if (n.family !== "IPv4" || n.internal) continue;
      const ip = n.address.split(".").map(Number);
      const mask = n.netmask.split(".").map(Number);
      out.add(ip.map((b, i) => (b & mask[i]) | (~mask[i] & 255)).join("."));
    }
  }
  return [...out];
}

export const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return send(res, 204, "");
  const url = new URL(req.url, "http://hub");
  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, { ok: true, mock: MOCK, hasKey: Boolean(GROQ_KEY), chatModel: CHAT_MODEL, voice: VOICE });
    }
    if (req.method === "GET" && url.pathname === "/events") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write(": connected\n\n");
      listeners.add(res);
      req.on("close", () => listeners.delete(res));
      return;
    }
    if (req.method === "POST" && url.pathname === "/chat") {
      const { text = "", context = "" } = JSON.parse((await readBody(req)).toString() || "{}");
      return send(res, 200, await companion(String(text), String(context)));
    }
    if (req.method === "POST" && url.pathname === "/talk") return await handleTalk(req, res, url);
    send(res, 404, { error: "not found" });
  } catch (e) {
    console.error("[error]", e.message);
    // The necklace treats any non-200 as "play the sad beep"
    send(res, e.short ? 422 : 500, { error: e.message });
  }
});

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  if (!GROQ_KEY && !MOCK) console.warn("No GROQ_API_KEY in .env. Set it, or run with MOCK_AI=1 to test without AI.");
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MindMirror Hub on http://localhost:${PORT}  (mock: ${MOCK})`);
    for (const list of Object.values(os.networkInterfaces()))
      for (const n of list || []) if (n.family === "IPv4" && !n.internal) console.log(`  necklace can reach me at ${n.address}:${PORT}`);
  });

  const sock = dgram.createSocket("udp4");
  sock.bind(() => {
    sock.setBroadcast(true);
    // Send to every Wi-Fi/LAN subnet's broadcast address (Windows ignores 255.255.255.255 on some setups)
    setInterval(() => {
      for (const addr of broadcastAddresses()) sock.send(`MINDMIRROR_HUB ${PORT}`, BEACON_PORT, addr, () => {});
    }, 2000);
  });
}
