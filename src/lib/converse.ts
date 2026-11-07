// One spoken conversation, shared by Voice mode and Face to face.
// Hub on: the mic goes to the hub (same AI as the necklace) and its voice plays here.
// Hub off: the browser listens (where it can) and asks an AI itself (src/lib/brain.ts), offline replies as the last resort.

import { useCallback, useEffect, useRef, useState } from "react";
import { chat, hubHealth, onHubEvent, outputLevel, pauseSpeaking, replayLast, resumeSpeaking, speakReply, speakWithBrowser, startTalk, stopSpeaking, unlockAudio, usePaused, useSpeaking, type Talk } from "./hub";

// If the hub fails to turn speech into text once (no Groq key, no internet), the browser listens from then on.
let hubCantListen = false;
import { offlineReply } from "./offline";
import { isCrisis } from "./support";
import { contextFor } from "./signals";
import { useInsights } from "./useInsights";
import { joinResults } from "./transcript";

export type Phase ="idle" | "listening" | "thinking" | "speaking";

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
};
const SR = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

/** `voice: false` keeps replies on screen only (the landing lets people choose).
 *  `mode: "therapist"` is Reenu or Roman face to face: a counsellor's way of listening, with memory of this conversation. */
export function useConversation(opts: { voice?: boolean; mode?: "companion" | "therapist"; persona?: "reenu" | "roman" } = {}) {
  const voiceOn = useRef(opts.voice !== false);
  useEffect(() => { voiceOn.current = opts.voice !== false; }, [opts.voice]);
  // one conversation = one session on the hub, so the AI remembers what was said
  const session = useRef(Math.random().toString(36).slice(2, 12));
  const ins = useInsights();
  const context = useRef("");
  useEffect(() => { context.current = ins ? contextFor(ins) : ""; }, [ins]);
  const persona = useRef(opts.persona);
  useEffect(() => { persona.current = opts.persona; }, [opts.persona]);
  const talkOpts = () => ({ mode: opts.mode ?? "companion", persona: persona.current, session: session.current, context: context.current });
  const speaking = useSpeaking();
  const paused = usePaused();
  // bumps on Stop, so a reply that arrives after Stop stays quiet
  const gen = useRef(0);
  const [busy, setBusy] = useState<null | "listening" | "thinking">(null);
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState("");
  const talk = useRef<Talk | null>(null);
  const rec = useRef<Recognition | null>(null);
  const micLevel = useRef<() => number>(() => 0);
  const waitingTurn = useRef(false);

  // The hub tells us what it heard and what it said (the audio itself comes back from /talk).
  useEffect(() => onHubEvent((e) => {
    if (e.type !== "turn" || e.source !== "web" || !waitingTurn.current) return;
    waitingTurn.current = false;
    setHeard(e.heard);
    setReply(e.reply);
    if (e.crisis || isCrisis(e.heard)) setCrisis(true);
    setBusy(null);
  }), []);

  const answer = useCallback(async (text: string) => {
    const my = ++gen.current;
    setHeard(text);
    setBusy("thinking");
    if (isCrisis(text)) setCrisis(true);
    let r: string;
    try {
      const res = await chat(text, context.current, talkOpts());
      if (my !== gen.current) return;
      r = res.reply;
      if (res.crisis) setCrisis(true);
      setReply(r);
      setBusy(null);
      if (voiceOn.current) await speakReply(r);
    } catch {
      if (my !== gen.current) return;
      r = offlineReply(text);
      setReply(r);
      setBusy(null);
      if (voiceOn.current) await speakWithBrowser(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    unlockAudio();
    stopSpeaking();
    setError("");
    if (busy) return;
    const health = await hubHealth();
    // The hub listens when it has a speech-to-text key; otherwise the browser listens and the hub only answers.
    if (health && health.stt !== false && !hubCantListen) {
      try {
        talk.current = await startTalk(talkOpts());
        micLevel.current = talk.current.level;
        setBusy("listening");
        return;
      } catch {
        setError("The microphone is blocked. Allow it in the address bar, or type below.");
        return;
      }
    }
    if (!SR) {
      setError(health ? "This browser can't listen here. Use Chrome, or type below." : "The hub is off and this browser can't listen. Type below instead.");
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    let text = "";
    r.onresult = (e) => {
      text = joinResults(Array.from(e.results).map((x) => x[0].transcript));
      setHeard(text);
    };
    r.onend = () => {
      rec.current = null;
      if (text.trim()) void answer(text.trim());
      else setBusy(null);
    };
    r.onerror = () => setError("I couldn't hear that. Try again, or type below.");
    rec.current = r;
    // A gentle fake level while the browser listens.
    micLevel.current = () => 0.25 + 0.2 * Math.sin(performance.now() / 180);
    setHeard("");
    setBusy("listening");
    r.start();
  }, [busy, answer]);

  const stop = useCallback(async () => {
    if (rec.current) {
      setBusy("thinking");
      rec.current.stop();
      return;
    }
    const t = talk.current;
    if (!t) return;
    talk.current = null;
    setBusy("thinking");
    waitingTurn.current = true;
    const my = ++gen.current;
    try {
      await t.stop();
      if (my !== gen.current) { stopSpeaking(); return; }
      // the turn event (text) normally arrives with the audio; never wait forever
      window.setTimeout(() => { if (waitingTurn.current) { waitingTurn.current = false; setBusy(null); } }, 4000);
    } catch (e) {
      waitingTurn.current = false;
      setBusy(null);
      if (my !== gen.current) return;
      if ((e as Error).message === "too short") setError("Speak a little longer before you tap Send.");
      else {
        // The hub couldn't turn speech into text (no Groq key or no internet): the browser listens from now on.
        hubCantListen = true;
        setError(SR ? "The hub couldn't hear that, so this browser will listen now. Tap Listen and say it again." : "The hub didn't answer. Type below instead.");
      }
    }
  }, []);

  /** Stop everything: listening (nothing is sent), thinking (the answer is dropped) and speaking. */
  const cancel = useCallback(() => {
    gen.current++;
    waitingTurn.current = false;
    talk.current?.cancel();
    talk.current = null;
    const r = rec.current;
    if (r) { r.onend = null; r.onresult = null; r.stop(); rec.current = null; }
    stopSpeaking();
    setBusy(null);
  }, []);

  const pause = useCallback(() => pauseSpeaking(), []);
  const resume = useCallback(() => resumeSpeaking(), []);
  /** Say the last reply again. */
  const replay = useCallback(() => { if (!busy) void replayLast(); }, [busy]);

  useEffect(() => () => { talk.current?.cancel(); stopSpeaking(); }, []);

  const phase: Phase = busy ?? (speaking ? "speaking" : "idle");
  const level = useCallback(() => (busy === "listening" ? micLevel.current() : outputLevel()), [busy]);

  return { phase, paused, level, heard, reply, crisis, error, start, stop, cancel, pause, resume, replay, say: answer };
}
