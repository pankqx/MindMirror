// Talking to the laptop hub (hub/server.mjs). The API key lives only in the hub.

import { db, type Mood, type VoiceTurn } from "./db";

export const HUB = "http://localhost:8787";

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
}

export async function hubOnline(): Promise<boolean> {
  try {
    const r = await fetch(`${HUB}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

/** Typed chat. `context` = proof sentences of signals that need attention. */
export async function chat(text: string, context = ""): Promise<Reply> {
  const r = await fetch(`${HUB}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context }),
  });
  if (!r.ok) throw new Error(`hub ${r.status}`);
  return (await r.json()) as Reply;
}

/** Live voice turns (necklace and browser). Call once; returns a stop function. */
export function onVoiceTurn(cb: (t: TurnEvent) => void) {
  const es = new EventSource(`${HUB}/events`);
  es.onmessage = (e) => {
    try {
      const t = JSON.parse(e.data) as TurnEvent;
      if (t.type === "turn") cb(t);
    } catch {
      /* ignore keep-alives */
    }
  };
  return () => es.close();
}

/** Save every live turn into the browser database, so Home and Companion show it. */
export function startSavingTurns() {
  return onVoiceTurn((t) => {
    const turn: VoiceTurn = {
      at: t.at, heard: t.heard, reply: t.reply, mood: t.mood, signals: t.signals ?? [], source: t.source,
    };
    void db.voice.add(turn);
  });
}

/** "Hold to talk" in the browser: same hub, same AI. The reply plays in the browser. */
export async function startTalk() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => parts.push(e.data);
  rec.start();
  return async function stop() {
    const stopped = new Promise((r) => (rec.onstop = r));
    rec.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    const r = await fetch(`${HUB}/talk?src=web`, {
      method: "POST",
      headers: { "Content-Type": "audio/webm" },
      body: new Blob(parts, { type: "audio/webm" }),
    });
    if (!r.ok) throw new Error(`hub ${r.status}`);
    await new Audio(URL.createObjectURL(await r.blob())).play();
  };
}
