import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConversation } from "../lib/converse";
import type { Go } from "../lib/nav";
import { usePrefs } from "../lib/prefs";
import UrgentHelp from "../screens/UrgentHelp";
import { BackPill, Cursor } from "./bits";
import { useMedia } from "../components/landing/motion";
import { Spoken } from "./VoiceMode";
import { InkCharacter } from "../character/InkCharacter";
import { characters, type CharState, type Expression } from "../character/characters";

type Who = "reenu" | "roman";
const WHO: { id: Who; label: string }[] = [
  { id: "reenu", label: "Reenu" },
  { id: "roman", label: "Roman" },
];
const readWho = (): Who => {
  try {
    return localStorage.getItem("mm-character") === "roman" ? "roman" : "reenu";
  } catch {
    return "reenu";
  }
};
/** A round control with a small label under it. */
function Ctl({ label, onClick, disabled, on, children }: { label: string; onClick: () => void; disabled?: boolean; on?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex w-12 flex-col items-center gap-1.5">
      <motion.button onClick={onClick} disabled={disabled} aria-label={label} title={label} whileTap={disabled ? undefined : { scale: 0.9 }}
        className={`grid h-12 w-12 place-items-center rounded-full transition-colors disabled:cursor-default disabled:opacity-35 ${on ? "bg-white text-black" : "mm-glass text-ink hover:bg-white/10"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
      </motion.button>
      <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.1em] text-faint">{label}</span>
    </div>
  );
}

const STATE: Record<string, CharState> = { idle: "IDLE", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING" };

const ease = [0.22, 1, 0.36, 1] as const;

/** Face to face with Reenu or Roman: an AI companion who listens like a therapist, remembers, and talks back. */
export default function FaceMode({ go }: { go: Go }) {
  const [who, setWhoState] = useState<Who>(readWho);
  const c = useConversation({ mode: "therapist", persona: who });
  const live = useRef(c);
  useLayoutEffect(() => { live.current = c; });
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const { name } = usePrefs();
  const [greeting, setGreeting] = useState(true);
  const setWho = (w: Who) => {
    setWhoState(w);
    setGreeting(true);
    try { localStorage.setItem("mm-character", w); } catch { /* private mode */ }
  };
  useEffect(() => {
    if (!greeting) return;
    const t = window.setTimeout(() => setGreeting(false), 2600);
    return () => window.clearTimeout(t);
  }, [greeting]);
  const persona = characters[who];
  const inkState: CharState = greeting && c.phase === "idle" ? "GREETING" : STATE[c.phase];
  const expr: Expression = c.crisis ? "concerned" : c.phase === "idle" && c.reply ? "happy" : "neutral";
  const displayName = persona.name;
  const lg = useMedia("(min-width: 1024px)");


  // Space bar: hold to talk
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || (e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      if (live.current.phase !== "listening") void live.current.start();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).tagName === "INPUT") return;
      if (live.current.phase === "listening") void live.current.stop();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  /** Listen → Send; while they talk, Talk back interrupts and listens. */
  const main = () => {
    if (c.phase === "listening") void c.stop();
    else if (c.phase === "idle" || c.phase === "speaking") void c.start();
  };

  const status = c.error || { idle: "Tap Listen, or hold Space, and say what's on your mind.", listening: `${displayName} is listening…`, thinking: `${displayName} is thinking…`, speaking: "" }[c.phase];

  return (
    <div className="night fixed inset-0 z-50 overflow-clip text-ink" style={{ background: "#07060a" }}>
      <Cursor />
      {/* the room: a dark stage with a warm wooden floor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 55% at 50% 38%, rgba(120,110,170,0.22), transparent 70%)" }} />
        <div className="absolute inset-x-[-20%] bottom-0 h-[42%] origin-bottom" style={{
          transform: "perspective(600px) rotateX(58deg)",
          background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.0) 0 58px, rgba(0,0,0,0.22) 58px 60px), linear-gradient(180deg, #120a05 0%, #3a2210 55%, #55331a 100%)",
          maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
        }} />
        <div className="absolute inset-x-0 bottom-[18%] h-[30%]" style={{ background: "radial-gradient(40% 60% at 50% 100%, rgba(255,190,120,0.16), transparent 70%)" }} />
      </div>

      {/* Reenu or Roman, big like in pank-os: the figure fills the room from the floor up,
          their name huge and faint behind them. Phone: centred; laptop: the left side. */}
      <AnimatePresence mode="wait">
        <motion.div key={persona.id} className="pointer-events-none absolute inset-x-0 bottom-[44px] top-[68px] flex items-end justify-center lg:bottom-0 lg:right-auto lg:top-0 lg:w-[58%]"
          initial={{ opacity: 0, y: 60, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 30, filter: "blur(12px)" }} transition={{ duration: 0.9, ease }}>
          <span aria-hidden="true" className="absolute inset-x-0 top-[6%] select-none text-center font-display leading-none text-white/[0.06] lg:top-[12%]"
            style={{ fontSize: "clamp(7rem, 30vw, 22rem)" }}>{persona.name}</span>
          <div className="absolute bottom-[-12%] h-[90vh] w-[90vh] max-w-[140vw] rounded-full"
            style={{ background: `radial-gradient(closest-side, ${persona.accent}5e, rgba(255,214,170,0.26) 45%, transparent 75%)` }} />
          <InkCharacter config={persona} state={inkState} expression={expr} level={c.phase === "speaking" ? c.level : undefined}
            height={lg ? "96vh" : "calc(100svh - 112px)"} className="relative shrink-0" label={`${persona.name}, your companion (illustration)`} />
        </motion.div>
      </AnimatePresence>
      {/* the bottom fades to the floor so the reply and buttons stay readable over the figure */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] lg:hidden" aria-hidden="true"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(7,6,10,0.82) 45%, rgba(7,6,10,0.96))" }} />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 lg:p-8">
        <BackPill onClick={() => go("landing")} />
        <div className="mm-glass absolute left-1/2 top-[72px] flex -translate-x-1/2 rounded-full p-1 lg:static lg:translate-x-0" role="tablist" aria-label="Choose who to talk to">
          {WHO.map((w) => (
            <button key={w.id} role="tab" aria-selected={who === w.id} onClick={() => setWho(w.id)}
              className={`relative h-8 rounded-full px-4 text-[13px] font-medium transition-colors ${who === w.id ? "text-black" : "text-soft hover:text-ink"}`}>
              {who === w.id && <motion.span layoutId="who-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{w.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => go("voice")} className="mm-glass h-10 rounded-full px-4 text-[13px] font-medium transition-colors hover:bg-white/10">
          Voice only
        </button>
      </header>

      <motion.div className="pointer-events-none absolute inset-x-0 top-[124px] z-10 px-6 text-center lg:inset-x-auto lg:right-[6vw] lg:top-[18vh] lg:w-[460px] lg:px-0 lg:text-left"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1, ease }}>
        <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-faint lg:block">AI companion and AI therapist · listens, remembers this talk</p>
        <h1 className="font-display text-[2rem] leading-none [text-shadow:0_2px_24px_rgba(0,0,0,0.8)] lg:text-[3.6rem]">{name ? `Hi ${name}, I'm ${displayName}.` : `Hi, I'm ${displayName}.`}</h1>
        <p className="mx-auto mt-3 hidden max-w-sm text-[13px] leading-relaxed text-soft lg:mx-0 lg:block lg:text-[15px]">
          {`${persona.tagline[0].toUpperCase()}${persona.tagline.slice(1)}.`} Tell me anything; together we'll find one small next step. It never diagnoses.
        </p>
      </motion.div>

      {c.crisis && <div className="absolute inset-x-4 top-24 z-20 mx-auto max-w-lg"><UrgentHelp /></div>}

      <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3 px-5 lg:inset-x-auto lg:bottom-[10vh] lg:right-[6vw] lg:w-[460px] lg:px-0">
        {/* heard + reply, right above the controls */}
        <div className="pointer-events-auto w-full text-center">
        <AnimatePresence mode="wait">
            {c.reply && c.phase !== "listening" ? (
              <motion.div key={c.reply} exit={{ opacity: 0, y: -8 }} className="mm-glass mx-auto max-h-[30vh] max-w-2xl overflow-y-auto rounded-3xl px-5 py-3 sm:px-6 sm:py-4" style={{ background: "rgba(10,10,16,0.62)" }}>
                {c.heard && <p className="mb-3 text-[13px] italic text-faint">“{c.heard}”</p>}
                <Spoken text={c.reply} className="mx-auto max-w-2xl font-display text-[1.2rem] leading-snug sm:text-[1.55rem] lg:text-[2.1rem]" />
              </motion.div>
            ) : (
              <motion.p key={c.phase + c.error} className="mm-glass mx-auto w-fit rounded-full px-4 py-2 text-[13px] text-soft" style={{ background: "rgba(10,10,16,0.62)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {c.phase === "listening" && c.heard ? `“${c.heard}”` : status}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {typing && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void c.say(text.trim()); setText(""); } }}
              className="mm-glass flex w-full max-w-md items-center gap-2 rounded-full p-1.5 pl-5">
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`Type to ${displayName}…`}
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint" />
              <button className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Send</button>
            </motion.form>
          )}
        </AnimatePresence>
        {/* the controls: stop, pause, listen / send / talk back, say again, real people */}
        <div className="flex max-w-full items-end gap-2 sm:gap-3">
          <Ctl label="Stop" onClick={() => c.cancel()} disabled={c.phase === "idle"}>
            <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
          </Ctl>
          <Ctl label={c.paused ? "Resume" : "Pause"} onClick={() => (c.paused ? c.resume() : c.pause())} disabled={c.phase !== "speaking"} on={c.paused}>
            {c.paused ? <path d="M8 5.5v13l10.5-6.5z" /> : <path d="M8.5 5.5v13M15.5 5.5v13" />}
          </Ctl>
          <div className="flex flex-col items-center gap-1.5">
            <motion.button onClick={main} whileTap={{ scale: 0.94 }} disabled={c.phase === "thinking"}
              className={`relative flex h-14 min-w-[118px] items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-[14px] font-semibold sm:min-w-[150px] sm:px-6 sm:text-[15px] transition-colors disabled:opacity-70 ${c.phase === "listening" ? "bg-white text-black" : "mm-glass text-ink hover:bg-white/10"}`}>
              {c.phase === "listening" && (
                <motion.span className="absolute inset-0 rounded-full bg-black/5" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }} />
              )}
              {c.phase === "listening" ? (<><span className="relative h-2.5 w-2.5 rounded-full bg-[#e25b45]" /><span className="relative">Send</span></>)
                : c.phase === "thinking" ? (<>Thinking…</>)
                : (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                  {c.phase === "speaking" ? "Talk back" : "Listen"}</>)}
            </motion.button>
            <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
              {c.phase === "listening" ? "listening…" : c.phase === "speaking" ? (c.paused ? "paused" : "talking") : "or hold Space"}
            </span>
          </div>
          <Ctl label="Again" onClick={() => c.replay()} disabled={!c.reply || c.phase === "listening" || c.phase === "thinking"}>
            <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.8h3.8" />
          </Ctl>
          <Ctl label="Help" onClick={() => go("support")}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </Ctl>
        </div>
        <button onClick={() => setTyping((v) => !v)} className="text-[12px] text-soft underline decoration-white/20 underline-offset-4 hover:text-ink">
          {typing ? "Hide typing" : `Or type to ${displayName}`}
        </button>
        <p className="text-[11px] text-faint">{displayName} is an AI, not a licensed therapist or doctor. For a real person: Tele-MANAS 14416.</p>
      </div>
    </div>
  );
}
