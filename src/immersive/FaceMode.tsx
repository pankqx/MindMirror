import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConversation } from "../lib/converse";
import type { Go } from "../lib/nav";
import { usePrefs } from "../lib/prefs";
import UrgentHelp from "../screens/UrgentHelp";
import { BackPill, Cursor } from "./bits";
import { createFace, type Face } from "./face3d";
import { Spoken } from "./VoiceMode";
import { InkCharacter } from "../character/InkCharacter";
import { characters, type CharState, type Expression } from "../character/characters";

type Who = "reenu" | "roman" | "mira";
const WHO: { id: Who; label: string }[] = [
  { id: "reenu", label: "Reenu" },
  { id: "roman", label: "Roman" },
  { id: "mira", label: "Mira" },
];
const readWho = (): Who => {
  try {
    const v = localStorage.getItem("mm-character");
    return v === "roman" || v === "mira" ? v : "reenu";
  } catch {
    return "reenu";
  }
};
const STATE: Record<string, CharState> = { idle: "IDLE", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING" };

const ease = [0.22, 1, 0.36, 1] as const;

// Floating moments around the room: soft, photo-like light, each with a small line.
const MOMENTS = [
  { x: -44, y: -20, z: -260, w: 190, h: 120, a: "#f0a27a", b: "#3a2a5a", line: "Sea breeze after class" },
  { x: -30, y: 14, z: -120, w: 150, h: 100, a: "#7aa7f0", b: "#1c2340", line: "Exam week" },
  { x: -46, y: 28, z: -380, w: 170, h: 110, a: "#e8d07a", b: "#3d2b16", line: "Chai with Amma" },
  { x: 34, y: -24, z: -200, w: 200, h: 130, a: "#9fd8c8", b: "#173a37", line: "Morning walk" },
  { x: 44, y: 10, z: -90, w: 160, h: 104, a: "#c99af0", b: "#2a1c40", line: "Late night lab" },
  { x: 28, y: 30, z: -330, w: 180, h: 116, a: "#f0b7c9", b: "#40202c", line: "Friends, Saturday" },
  { x: -12, y: -34, z: -480, w: 140, h: 90, a: "#a9b0ff", b: "#1a1d3a", line: "First day" },
  { x: 16, y: -36, z: -520, w: 150, h: 96, a: "#ffd2a8", b: "#3a2412", line: "Home" },
];

function Moment({ m, i, mx, my }: { m: (typeof MOMENTS)[number]; i: number; mx: MotionValue<number>; my: MotionValue<number> }) {
  const depth = 1 - m.z / -600;
  const x = useTransform(mx, (v) => v * -40 * depth);
  const y = useTransform(my, (v) => v * -24 * depth);
  return (
    <motion.div className="absolute left-1/2 top-1/2" style={{ x, y, marginLeft: `${m.x}vw`, marginTop: `${m.y}vh` }}>
      <motion.div
        className="overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ width: m.w * (0.6 + depth * 0.5), height: m.h * (0.6 + depth * 0.5), translateZ: m.z, filter: `blur(${(1 - depth) * 2.4}px)`, opacity: 0.35 + depth * 0.5 }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.35 + depth * 0.5, scale: 1, y: [0, -10, 0] }}
        transition={{ opacity: { delay: 0.4 + i * 0.12, duration: 1.2 }, scale: { delay: 0.4 + i * 0.12, duration: 1.2, ease }, y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" } }}>
        <div className="relative h-full w-full" style={{ background: `radial-gradient(80% 90% at 30% 30%, ${m.a}, ${m.b})` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(40% 50% at ${60 + (i % 3) * 10}% 60%, rgba(255,255,255,0.35), transparent 70%)` }} />
          <span className="absolute bottom-2 left-3 text-[10px] font-medium tracking-wide text-white/80">{m.line}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Face to face with Mira. She looks at you, listens, thinks, and talks back. */
export default function FaceMode({ go }: { go: Go }) {
  const c = useConversation();
  const live = useRef(c);
  useLayoutEffect(() => { live.current = c; });
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState<"loading" | "ok" | "fail">("loading");
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const { name } = usePrefs();
  const [who, setWhoState] = useState<Who>(readWho);
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
  const persona = who === "mira" ? null : characters[who];
  const inkState: CharState = greeting && c.phase === "idle" ? "GREETING" : STATE[c.phase];
  const expr: Expression = c.crisis ? "concerned" : c.phase === "idle" && c.reply ? "happy" : "neutral";
  const displayName = persona?.name ?? "Mira";
  const mx = useMotionValue(0), my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 }), smy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    let face: Face | null = null;
    let raf = 0;
    let dead = false;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    if (who !== "mira" || !canvas.current) return () => window.removeEventListener("pointermove", onMove);
    setReady("loading");
    createFace(canvas.current, `${import.meta.env.BASE_URL}models/face.glb`)
      .then((f) => {
        if (dead) return f.dispose();
        face = f;
        setReady("ok");
        const tick = () => {
          const { phase, level } = live.current;
          face?.update(phase, level());
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setReady("fail"));
    return () => { dead = true; cancelAnimationFrame(raf); face?.dispose(); window.removeEventListener("pointermove", onMove); };
  }, [mx, my, who]);

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

  const status = c.error || { idle: "Tap Talk, or hold Space, and say what's on your mind.", listening: `${displayName} is listening…`, thinking: `${displayName} is thinking…`, speaking: "" }[c.phase];

  return (
    <div className="night fixed inset-0 z-50 overflow-hidden text-ink" style={{ background: "#07060a" }}>
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
      <div className="pointer-events-none absolute inset-0 hidden md:block" style={{ perspective: 900 }} aria-hidden="true">
        {MOMENTS.map((m, i) => <Moment key={i} m={m} i={i} mx={smx} my={smy} />)}
      </div>

      {/* Reenu or Roman, standing in a pool of warm light */}
      <AnimatePresence mode="wait">
        {persona && (
          <motion.div key={persona.id} className="pointer-events-none absolute inset-x-0 bottom-[118px] flex justify-center lg:bottom-[128px]"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, filter: "blur(10px)" }} transition={{ duration: 0.8, ease }}>
            <div className="absolute -bottom-[10%] h-[64vh] w-[64vh] max-w-[110vw] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${persona.accent}55, rgba(255,214,170,0.28) 45%, transparent 75%)` }} />
            <InkCharacter config={persona} state={inkState} expression={expr} level={c.phase === "speaking" ? c.level : undefined}
              height="min(56vh, 112vw)" className="relative" label={`${persona.name}, your companion (illustration)`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mira */}
      {who === "mira" && <motion.canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label="Mira, a face made of light"
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: ready === "ok" ? 1 : 0, scale: ready === "ok" ? 1 : 0.96 }} transition={{ duration: 1.6, ease }} />}
      {who === "mira" && ready === "loading" && (
        <div className="absolute inset-0 grid place-items-center">
          <motion.span className="h-24 w-24 rounded-full border border-white/20" animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
        </div>
      )}
      {who === "mira" && ready === "fail" && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center text-soft">
          This device can't draw Mira in 3D, but she can still listen and talk.
        </div>
      )}

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

      <motion.div className="pointer-events-none absolute inset-x-0 top-[124px] z-10 px-6 text-center lg:top-[96px]"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1, ease }}>
        <h1 className="font-display text-[2.4rem] leading-none lg:text-[3.2rem]">{name ? `Hi ${name}, I'm ${displayName}.` : `Hi, I'm ${displayName}.`}</h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-soft lg:text-[14px]">
          {persona ? `${persona.tagline[0].toUpperCase()}${persona.tagline.slice(1)}.` : "A listener made of light."} Tell me anything; together we'll find one small next step.
        </p>
      </motion.div>

      {/* heard + reply */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[132px] z-10 px-4 text-center">
        <AnimatePresence mode="wait">
          {c.reply && c.phase !== "listening" ? (
            <motion.div key={c.reply} exit={{ opacity: 0, y: -8 }} className="mm-glass mx-auto max-w-2xl rounded-3xl px-6 py-4" style={{ background: "rgba(10,10,16,0.62)" }}>
              {c.heard && <p className="mb-3 text-[13px] italic text-faint">“{c.heard}”</p>}
              <Spoken text={c.reply} className="mx-auto max-w-2xl font-display text-[1.55rem] leading-snug lg:text-[2.1rem]" />
            </motion.div>
          ) : (
            <motion.p key={c.phase + c.error} className="mm-glass mx-auto w-fit rounded-full px-4 py-2 text-[13px] text-soft" style={{ background: "rgba(10,10,16,0.62)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {c.phase === "listening" && c.heard ? `“${c.heard}”` : status}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {c.crisis && <div className="absolute inset-x-4 top-24 z-20 mx-auto max-w-lg"><UrgentHelp /></div>}

      <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3 px-5 lg:bottom-8">
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
        <div className="flex items-center gap-3">
          <button onClick={() => setTyping((v) => !v)} aria-label="Type instead"
            className="mm-glass grid h-12 w-12 place-items-center rounded-full text-soft transition-colors hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></svg>
          </button>
          <motion.button onClick={tap} whileTap={{ scale: 0.94 }}
            className={`relative flex h-14 items-center gap-2 overflow-hidden rounded-full px-7 text-[15px] font-semibold transition-colors ${c.phase === "listening" ? "bg-white text-black" : "mm-glass text-ink hover:bg-white/10"}`}>
            {c.phase === "listening" ? (<><span className="h-2.5 w-2.5 rounded-sm bg-black" /> Done</>)
              : c.phase === "speaking" ? "Stop"
              : c.phase === "thinking" ? "…"
              : (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg> Talk to {displayName}</>)}
          </motion.button>
          <button onClick={() => go("support")} aria-label="Real people"
            className="mm-glass grid h-12 w-12 place-items-center rounded-full text-soft transition-colors hover:text-ink" title="Talk to a real person">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          </button>
        </div>
        <p className="text-[11px] text-faint">{displayName} is an AI companion, not a therapist. For real help: Tele-MANAS 14416.</p>
      </div>
    </div>
  );
}
