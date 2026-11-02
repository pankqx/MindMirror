import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useConversation, type Phase } from "../lib/converse";
import type { Go } from "../lib/nav";
import UrgentHelp from "../screens/UrgentHelp";
import { BackPill } from "./bits";
import { createSkyOrb, type SkyOrb } from "./skyOrb";

const ease = [0.22, 1, 0.36, 1] as const;

const HINT: Record<Phase, string> = {
  idle: "Tap the sky and talk. Tap again when you're done.",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "",
};

/** A sentence that arrives word by word, like it's being said. */
export function Spoken({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.p key={text} className={className} initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.055 } } }}>
      {words.map((w, i) => (
        <motion.span key={i} className="inline-block"
          variants={{ h: { opacity: 0, y: 8, filter: "blur(6px)" }, s: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } } }}>
          {w}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.p>
  );
}

/** For tired evenings: no screen to read, just a voice. Like a phone call with a calm friend. */
export default function VoiceMode({ go }: { go: Go }) {
  const c = useConversation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const orb = useRef<SkyOrb | null>(null);
  const live = useRef(c);
  live.current = c;
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!canvas.current) return;
    try {
      orb.current = createSkyOrb(canvas.current);
    } catch {
      return;
    }
    let raf = 0;
    const tick = () => {
      const { phase, level } = live.current;
      orb.current?.set(phase === "listening" || phase === "speaking" ? level() : 0, phase === "thinking");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); orb.current?.dispose(); };
  }, []);

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

  const tap = () => {
    if (c.phase === "listening") void c.stop();
    else if (c.phase === "speaking") c.cancel();
    else if (c.phase === "idle") void c.start();
  };

  return (
    <div className="night mm-grain fixed inset-0 z-50 overflow-hidden bg-black text-ink">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <button onClick={tap} aria-label={c.phase === "listening" ? "Stop and send" : "Start talking"}
        className="absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" data-cursor="talk" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between p-5 lg:p-8">
        <BackPill onClick={() => go("landing")} />
        <span className="text-[12px] tracking-[0.2em] text-faint">VOICE MODE</span>
        <button onClick={() => go("face")} className="mm-glass h-10 rounded-full px-4 text-[13px] font-medium transition-colors hover:bg-white/10">
          Face to face
        </button>
      </header>

      {/* what you said, softly, above */}
      <div className="pointer-events-none absolute inset-x-0 top-[13%] px-6 text-center">
        <AnimatePresence mode="wait">
          {c.heard && (
            <motion.p key={c.heard} className="mx-auto max-w-xl text-[15px] italic text-faint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              “{c.heard}”
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* the reply, as captions below the orb */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[17%] px-6 text-center">
        <AnimatePresence mode="wait">
          {c.reply && c.phase !== "listening" ? (
            <motion.div key={c.reply} initial={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
              <Spoken text={c.reply} className="mx-auto max-w-2xl font-display text-[1.7rem] leading-snug text-ink lg:text-[2.3rem]" />
            </motion.div>
          ) : (
            <motion.p key={c.phase} className="text-[14px] text-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {c.error || HINT[c.phase]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {c.crisis && <div className="absolute inset-x-4 top-20 mx-auto max-w-lg"><UrgentHelp /></div>}

      {/* controls */}
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-5 lg:bottom-8">
        <AnimatePresence>
          {typing && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void c.say(text.trim()); setText(""); } }}
              className="mm-glass flex w-full max-w-md items-center gap-2 rounded-full p-1.5 pl-5">
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Say it in words…"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint" />
              <button className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Send</button>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <button onClick={() => setTyping((v) => !v)} aria-label="Type instead"
            className="mm-glass grid h-12 w-12 place-items-center rounded-full text-soft transition-colors hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></svg>
          </button>
          <motion.button onClick={tap} whileTap={{ scale: 0.94 }}
            className={`flex h-14 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors ${c.phase === "listening" ? "bg-white text-black" : "mm-glass text-ink hover:bg-white/10"}`}>
            {c.phase === "listening" ? (<><span className="h-2.5 w-2.5 rounded-sm bg-black" /> Done</>)
              : c.phase === "speaking" ? "Stop"
              : c.phase === "thinking" ? "…"
              : (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg> Talk</>)}
          </motion.button>
          <button onClick={() => go("landing")} aria-label="End"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#ff5f57]/90 text-white transition-transform hover:scale-105">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="hidden text-[11px] text-faint lg:block">or hold Space to talk</p>
      </div>
    </div>
  );
}
