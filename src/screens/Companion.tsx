import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Chat, { type HoldState, type Message } from "../components/Chat";
import { NecklaceIcon } from "../components/Icons";
import { db } from "../lib/db";
import { chat, startTalk, useHubOnline, useSpeaking, useThinking, type Talk } from "../lib/hub";
import { contextFor } from "../lib/signals";
import { isCrisis } from "../lib/support";
import { offlineReply } from "../lib/offline";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";
import { PageHeader } from "../components/ui";
import { Logo } from "../components/TopBar";
import { InkCharacter } from "../character/InkCharacter";
import { characters, type CharState } from "../character/characters";
import { setCompanion, useCompanion } from "../lib/companion";

interface Msg extends Message { at: string }

const SUGGESTIONS = ["I slept only four hours", "Too many deadlines this week", "I feel a bit alone", "I don't feel like going to class"];

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

  const session = useRef(Math.random().toString(36).slice(2, 12));

  async function send(t: string) {
    if (busy) return;
    setError("");
    setTyped((m) => [...m, { from: "me", text: t, at: new Date().toISOString() }]);
    if (isCrisis(t)) setCrisis(true);
    setBusy(true);
    try {
      // Reenu or Roman answers as an AI companion who listens like a therapist, and remembers this chat
      const r = await chat(t, ins ? contextFor(ins) : "", { mode: "therapist", persona: who, session: session.current });
      if (r.crisis) setCrisis(true);
      setTyped((m) => [...m, { from: "mindmirror", text: r.reply, at: new Date().toISOString() }]);
    } catch {
      await new Promise((r) => setTimeout(r, 700));
      setTyped((m) => [...m, { from: "mindmirror", text: offlineReply(t), note: "offline reply (AI not reachable)", at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  async function holdStart() {
    setError("");
    try {
      const talk = await startTalk({ mode: "therapist", persona: who, session: session.current, context: ins ? contextFor(ins) : "" });
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
  const who = useCompanion() ?? "reenu";
  const cfg = characters[who];
  const inkState: CharState = state === "listening" ? "LISTENING" : state === "speaking" ? "SPEAKING" : busy || thinking || state === "thinking" ? "THINKING" : "IDLE";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
    <div className="min-w-0 space-y-4">
      {(crisis || ins?.crisis) && <UrgentHelp />}

      <PageHeader eyebrow="Companion" title={<>Talk it <em className="italic">out</em>.</>}
        right={
          <div className="relative grid h-14 w-14 shrink-0 place-items-center">
            <motion.span className="absolute inset-0 rounded-full border border-indigo"
              animate={{ scale: state === "speaking" ? [1, 1.25, 1] : thinking || state === "thinking" ? [1, 0.88, 1] : [1, 1.06, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ duration: state === "speaking" ? 0.7 : 4, repeat: Infinity, ease: "easeInOut" }} />
            <Logo size={34} />
          </div>
        }
        lede={
          <AnimatePresence mode="wait">
            <motion.span key={`${online}-${thinking}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {thinking === "necklace" ? (
                <span className="inline-flex items-center gap-1.5 text-indigo"><NecklaceIcon size={14} /> Your necklace is talking to me…</span>
              ) : online ? "I listen, reflect, and suggest one small step. Type, hold the mic (or Space), or use your necklace."
                : online === false ? "Ask me anything. I'll answer with an AI straight from this browser. For hold to talk, use Voice mode or Face to face." : "Connecting…"}
            </motion.span>
          </AnimatePresence>
        } />

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

    {/* your companion, listening while you type */}
    <aside className="relative hidden lg:block" style={{ ["--accent" as string]: cfg.accent }}>
      <div className="sticky top-8 flex flex-col items-center">
        <div className="t-caption-sm mb-2 flex gap-1 self-end rounded-[4px] border border-line p-1" role="tablist" aria-label="Choose your companion">
          {(["reenu", "roman"] as const).map((id) => (
            <button key={id} role="tab" aria-selected={who === id} onClick={() => setCompanion(id)}
              className={`rounded-[3px] px-2.5 py-1 transition-colors ${who === id ? "bg-ink text-bg" : "text-soft hover:text-ink"}`}>{characters[id].name}</button>
          ))}
        </div>
        <span className="absolute bottom-0 h-1/2 w-full rounded-full bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-20" aria-hidden="true" />
        <InkCharacter key={who} config={cfg} state={inkState} height="min(70vh, 640px)" className="relative" label={`${cfg.name}, your companion (illustration)`} />
        <p className="font-display relative -mt-3 text-[3rem] italic leading-none text-[var(--accent)]">{cfg.name}</p>
        <p className="t-caption-sm relative mt-2 text-center text-faint">{cfg.tagline}</p>
      </div>
    </aside>
    </div>
  );
}
