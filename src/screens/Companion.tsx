import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Chat, { type HoldState, type Message } from "../components/Chat";
import { NecklaceIcon } from "../components/Icons";
import { db } from "../lib/db";
import { chat, startTalk, useHubOnline, useSpeaking, useThinking, type Talk } from "../lib/hub";
import { contextFor } from "../lib/signals";
import { isCrisis } from "../lib/support";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";

interface Msg extends Message { at: string }

const SUGGESTIONS = ["I slept only four hours", "Too many deadlines this week", "I feel a bit alone", "I don't feel like going to class"];

/** If the hub is off, still answer kindly (and say so). Code picks the step; nothing is diagnosed. */
function offlineReply(t: string): string {
  const s = t.toLowerCase();
  if (/sleep|slept|tired|awake|night/.test(s)) return "Short nights add up. Could tonight be 30 minutes earlier, with the phone in another corner of the room?";
  if (/deadline|exam|assignment|record|study|pressure|marks/.test(s)) return "That's a lot at once. Pick just the one task due first, and give it 25 focused minutes. That's enough for now.";
  if (/alone|lonely|nobody|friend|isolat/.test(s)) return "Feeling alone is heavy. Is there one person you could message today, even just a hello?";
  if (/class|motivat|bother|pointless|lazy/.test(s)) return "It's okay to feel flat. What's one small thing that would make today a little easier?";
  return "Thank you for telling me. What's one small thing that would help you feel a bit lighter right now?";
}

export default function Companion() {
  const ins = useInsights();
  const online = useHubOnline();
  const thinking = useThinking();
  const speaking = useSpeaking();
  const voice = useLiveQuery(() => db.voice.orderBy("at").toArray(), []);
  const [typed, setTyped] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [hold, setHold] = useState<HoldState>("idle");
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState("");
  const talkRef = useRef<Talk | null>(null);
  const [level, setLevel] = useState<(() => number) | undefined>(undefined);

  const msgs: Msg[] = [
    ...(voice ?? []).flatMap((v): Msg[] => [
      { from: "me", text: v.heard, via: v.source, at: v.at },
      { from: "mindmirror", text: v.reply, via: v.source === "necklace" ? undefined : v.source, at: v.at + "z" },
    ]),
    ...typed,
  ].sort((a, b) => a.at.localeCompare(b.at));

  async function send(t: string) {
    if (busy) return;
    setError("");
    setTyped((m) => [...m, { from: "me", text: t, at: new Date().toISOString() }]);
    if (isCrisis(t)) setCrisis(true);
    setBusy(true);
    try {
      const r = await chat(t, ins ? contextFor(ins) : "");
      if (r.crisis) setCrisis(true);
      setTyped((m) => [...m, { from: "mindmirror", text: r.reply, at: new Date().toISOString() }]);
    } catch {
      await new Promise((r) => setTimeout(r, 700));
      setTyped((m) => [...m, { from: "mindmirror", text: offlineReply(t), note: "offline reply (hub not running)", at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  async function holdStart() {
    setError("");
    try {
      const talk = await startTalk();
      talkRef.current = talk;
      setLevel(() => talk.level);
      setHold("listening");
    } catch {
      setError("Microphone not available. Allow the mic for this page, or type instead.");
    }
  }

  async function holdEnd() {
    const talk = talkRef.current;
    talkRef.current = null;
    if (!talk) return;
    setHold("thinking");
    try {
      await talk.stop(); // the turn arrives through /events and is saved by App; the reply plays here
      setHold("idle");
    } catch (e) {
      setHold("idle");
      setError((e as Error).message === "too short"
        ? "Hold the button a little longer while you speak."
        : "Can't reach the hub. Start it on this laptop (cd hub, npm start), or type instead.");
    }
  }

  // On a laptop, hold the Space bar to talk (when you're not typing).
  const keys = useRef({ holdStart, holdEnd });
  keys.current = { holdStart, holdEnd };
  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || typing(e)) return;
      e.preventDefault();
      void keys.current.holdStart();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || typing(e)) return;
      e.preventDefault();
      void keys.current.holdEnd();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const state: HoldState = hold !== "idle" ? hold : speaking ? "speaking" : "idle";

  return (
    <div className="space-y-4">
      {(crisis || ins?.crisis) && <UrgentHelp />}

      {/* companion presence */}
      <div className="flex items-center gap-4 rounded-3xl border border-line/70 bg-card p-4 shadow-soft">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center">
          <motion.span className="absolute inset-0 rounded-full bg-gradient-to-br from-sage to-indigo"
            animate={{ scale: state === "speaking" ? [1, 1.12, 1] : thinking || state === "thinking" ? [1, 0.9, 1] : [1, 1.04, 1] }}
            transition={{ duration: state === "speaking" ? 0.6 : 4, repeat: Infinity, ease: "easeInOut" }} />
          <span className="relative text-2xl">🌿</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">MindMirror</p>
          <AnimatePresence mode="wait">
            <motion.p key={`${online}-${thinking}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-soft">
              {thinking === "necklace" ? (
                <span className="flex items-center gap-1.5 text-indigo"><NecklaceIcon size={14} /> Your necklace is talking to me…</span>
              ) : online ? "Here with you. Type, hold the mic (or Space), or use your necklace."
                : online === false ? "Hub is off. I can still listen, with simple offline replies." : "Connecting…"}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <Chat
        messages={msgs}
        onSend={(t) => void send(t)}
        onHoldStart={() => void holdStart()}
        onHoldEnd={() => void holdEnd()}
        typing={busy || thinking !== null}
        hold={state}
        level={level}
        suggestions={msgs.length === 0 ? SUGGESTIONS : []}
      />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-sm font-semibold text-coral-ink">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
