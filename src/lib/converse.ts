// One spoken conversation, shared by Voice mode and Face to face.
// Hub on: the mic goes to the hub (same AI as the necklace) and its voice plays here.
// Hub off: the browser listens (where it can) and answers with kind offline replies.

import { useCallback, useEffect, useRef, useState } from "react";
import { chat, hubOnline, onHubEvent, outputLevel, speakReply, speakWithBrowser, startTalk, stopSpeaking, unlockAudio, useSpeaking, type Talk } from "./hub";
import { offlineReply } from "./offline";
import { isCrisis } from "./support";

export type Phase = "idle" | "listening" | "thinking" | "speaking";

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
};
const SR = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

export function useConversation() {
  const speaking = useSpeaking();
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
    setHeard(text);
    setBusy("thinking");
    if (isCrisis(text)) setCrisis(true);
    let r: string;
    try {
      const res = await chat(text);
      r = res.reply;
      if (res.crisis) setCrisis(true);
      setReply(r);
      setBusy(null);
      await speakReply(r);
    } catch {
      r = offlineReply(text);
      setReply(r);
      setBusy(null);
      await speakWithBrowser(r);
    }
  }, []);

  const start = useCallback(async () => {
    unlockAudio();
    stopSpeaking();
    setError("");
    if (busy) return;
    if (await hubOnline()) {
      try {
        talk.current = await startTalk();
        micLevel.current = talk.current.level;
        setBusy("listening");
        return;
      } catch {
        setError("The microphone is blocked. Allow it in the address bar, or type below.");
        return;
      }
    }
    if (!SR) {
      setError("The hub is off and this browser can't listen. Type below instead.");
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    let text = "";
    r.onresult = (e) => {
      text = Array.from(e.results).map((x) => x[0].transcript).join(" ");
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
    try {
      await t.stop();
      // the turn event (text) normally arrives with the audio; never wait forever
      window.setTimeout(() => { if (waitingTurn.current) { waitingTurn.current = false; setBusy(null); } }, 4000);
    } catch (e) {
      waitingTurn.current = false;
      setBusy(null);
      setError((e as Error).message === "too short" ? "Hold a little longer while you speak." : "The hub didn't answer. Try again in a moment.");
    }
  }, []);

  const cancel = useCallback(() => {
    talk.current?.cancel();
    talk.current = null;
    rec.current?.stop();
    stopSpeaking();
    setBusy(null);
  }, []);

  useEffect(() => () => { talk.current?.cancel(); stopSpeaking(); }, []);

  const phase: Phase = busy ?? (speaking ? "speaking" : "idle");
  const level = useCallback(() => (busy === "listening" ? micLevel.current() : outputLevel()), [busy]);

  return { phase, level, heard, reply, crisis, error, start, stop, cancel, say: answer };
}
