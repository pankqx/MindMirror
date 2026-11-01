// Talking to the laptop hub (hub/server.mjs). The API key lives only in the hub.

import { useEffect, useState, useSyncExternalStore } from "react";
import { db, type Mood, type VoiceTurn } from "./db";
import { getPrefs } from "./prefs";

/**
 * The hub runs on the laptop, port 8787. Use the same machine that served this page,
 * so a phone on the same Wi-Fi (http://192.168.x.x:5173) finds the laptop's hub too.
 * Override with localStorage "mindmirror.hub" if the hub is somewhere else.
 */
function hubUrl() {
  try {
    const custom = localStorage.getItem("mindmirror.hub");
    if (custom) return custom.replace(/\/$/, "");
  } catch {
    /* storage blocked */
  }
  return `http://${location.hostname || "localhost"}:8787`;
}

export const HUB = hubUrl();

export interface Reply {
  reply: string;
  mood: Mood;
  signals: string[];
  crisis?: boolean;
}

export interface TurnEvent extends Reply {
  type: "turn";
  at: string;
  source: "necklace" | "web";
  heard: string;
  /** Path on the hub of the reply's mp3 (newer hubs only). */
  audio?: string;
}

export interface ThinkingEvent {
  type: "thinking";
  source: "necklace" | "web";
}

export type HubEvent = TurnEvent | ThinkingEvent | { type: "idle" };

// ---------- hub status ----------

export async function hubOnline(): Promise<boolean> {
  try {
    const r = await fetch(`${HUB}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

/** Polls /health every 5 s. null = still checking. */
export function useHubOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await hubOnline();
      if (alive) setOnline(ok);
    };
    void check();
    const t = window.setInterval(check, 5000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);
  return online;
}

// ---------- chat ----------

/** Typed chat. `context` = proof sentences of signals that need attention. */
export async function chat(text: string, context = ""): Promise<Reply> {
  const r = await fetch(`${HUB}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`hub ${r.status}`);
  return (await r.json()) as Reply;
}

// ---------- live events (necklace and browser) ----------

/** "thinking" state: the necklace (or browser) sent audio and the hub is working on it. */
let thinking: null | "necklace" | "web" = null;
const thinkingSubs = new Set<() => void>();
let thinkingTimer = 0;
function setThinking(v: typeof thinking) {
  thinking = v;
  window.clearTimeout(thinkingTimer);
  if (v) thinkingTimer = window.setTimeout(() => setThinking(null), 20000); // never stuck
  thinkingSubs.forEach((f) => f());
}
export function useThinking() {
  return useSyncExternalStore(
    (f) => {
      thinkingSubs.add(f);
      return () => thinkingSubs.delete(f);
    },
    () => thinking,
  );
}

/** Live hub events. Call once; returns a stop function. Reconnects on its own. */
export function onHubEvent(cb: (e: HubEvent) => void) {
  const es = new EventSource(`${HUB}/events`);
  es.onmessage = (m) => {
    try {
      const e = JSON.parse(m.data) as HubEvent;
      if (e.type === "turn" || e.type === "thinking" || e.type === "idle") cb(e);
    } catch {
      /* ignore keep-alives */
    }
  };
  return () => es.close();
}

/** Back-compat helper: only voice turns. */
export function onVoiceTurn(cb: (t: TurnEvent) => void) {
  return onHubEvent((e) => {
    if (e.type === "turn") cb(e);
  });
}

/**
 * Save every live turn into the browser database (so Home and Companion show it),
 * and speak necklace replies through the laptop speaker.
 * Browser "Hold to talk" turns already play from the /talk response, so they are not replayed.
 */
export function startSavingTurns(onTurn?: (t: TurnEvent) => void) {
  return onHubEvent((e) => {
    if (e.type === "thinking") {
      setThinking(e.source);
      return;
    }
    if (e.type === "idle") {
      setThinking(null);
      return;
    }
    setThinking(null);
    const turn: VoiceTurn = {
      at: e.at, heard: e.heard, reply: e.reply, mood: e.mood, signals: e.signals ?? [], source: e.source,
    };
    void db.voice.add(turn);
    if (e.source === "necklace" && getPrefs().voiceReplies) void speakReply(e.reply, e.audio);
    onTurn?.(e);
  });
}

// ---------- laptop speaker ----------

/** Browsers block sound until the page has been clicked once. */
let unlocked = false;
const unlockSubs = new Set<() => void>();
let ctx: AudioContext | null = null;

export function audioUnlocked() {
  return unlocked;
}
export function useAudioUnlocked() {
  return useSyncExternalStore(
    (f) => {
      unlockSubs.add(f);
      return () => unlockSubs.delete(f);
    },
    () => unlocked,
  );
}

/** Call from any click: plays a silent sound so later replies can play on their own. */
export function unlockAudio() {
  if (unlocked) return;
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start();
    const a = new Audio();
    a.muted = true;
    a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
    void a.play().catch(() => {});
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
  unlocked = true;
  unlockSubs.forEach((f) => f());
}

let speaking: HTMLAudioElement | null = null;
const speakingSubs = new Set<() => void>();
let isSpeaking = false;
function setSpeaking(v: boolean) {
  isSpeaking = v;
  speakingSubs.forEach((f) => f());
}
export function useSpeaking() {
  return useSyncExternalStore(
    (f) => {
      speakingSubs.add(f);
      return () => speakingSubs.delete(f);
    },
    () => isSpeaking,
  );
}

async function playBlob(blob: Blob) {
  speaking?.pause();
  const a = new Audio(URL.createObjectURL(blob));
  speaking = a;
  setSpeaking(true);
  a.onended = a.onpause = () => setSpeaking(false);
  await a.play();
}

/** Speak a reply on this laptop: the hub's own voice first, the browser's voice if that fails. */
export async function speakReply(text: string, audioPath?: string) {
  try {
    const url = audioPath ? `${HUB}${audioPath}` : `${HUB}/speak?text=${encodeURIComponent(text)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`hub ${r.status}`);
    await playBlob(await r.blob());
  } catch {
    speakWithBrowser(text);
  }
}

export function speakWithBrowser(text: string) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  u.voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  u.rate = 0.95;
  u.onstart = () => setSpeaking(true);
  u.onend = u.onerror = () => setSpeaking(false);
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  speaking?.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  setSpeaking(false);
}

// ---------- "Hold to talk" in the browser ----------

export interface Talk {
  /** 0..1 microphone level, for the live ring. */
  level: () => number;
  /** Stop recording, send to the hub, play the reply here. */
  stop: () => Promise<void>;
  cancel: () => void;
}

/** Same hub, same AI as the necklace. The reply plays in the browser. */
export async function startTalk(): Promise<Talk> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => parts.push(e.data);
  rec.start();

  ctx ??= new AudioContext();
  void ctx.resume();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  const src = ctx.createMediaStreamSource(stream);
  src.connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  const started = Date.now();

  const level = () => {
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / buf.length) * 4);
  };

  const finish = async () => {
    const stopped = new Promise((r) => (rec.onstop = r));
    rec.stop();
    await stopped;
    src.disconnect();
    stream.getTracks().forEach((t) => t.stop());
  };

  return {
    level,
    cancel: () => void finish(),
    stop: async () => {
      await finish();
      if (Date.now() - started < 500) throw new Error("too short");
      const type = rec.mimeType || "audio/webm";
      const r = await fetch(`${HUB}/talk?src=web`, {
        method: "POST",
        headers: { "Content-Type": type.split(";")[0] },
        body: new Blob(parts, { type }),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error(`hub ${r.status}`);
      await playBlob(await r.blob());
    },
  };
}
