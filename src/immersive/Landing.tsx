import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Go } from "../lib/nav";
import { unlockAudio, useHubOnline } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";
import { db } from "../lib/db";
import { createField, type Field } from "./field";
import { Cursor, Magnetic, RevealWords } from "./bits";

const ease = [0.22, 1, 0.36, 1] as const;

const CHAPTERS = [
  { k: "01", title: "Every mind has its own weather.", line: "Thirty seconds a day: mood, sleep, stress, energy, and who you talked to." },
  { k: "02", title: "Compared with you. Never with anyone else.", line: "MindMirror learns your normal and notices when you start to drift from it." },
  { k: "03", title: "A mirror, not a diagnosis.", line: "Every signal shows its proof, and points you to calm tools or real people." },
];

/** The giant name. Each letter leans away from the cursor, like the field behind it. */
function KineticName({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const letters = "MINDMIRROR".split("");
  return (
    <h1 aria-label="MindMirror" className="pointer-events-none flex select-none justify-center font-display leading-[0.8] tracking-[-0.02em]"
      style={{ fontSize: "clamp(4.2rem, 17.5vw, 19rem)" }}>
      {letters.map((l, i) => (
        <Letter key={i} l={l} i={i} n={letters.length} mx={mx} my={my} />
      ))}
    </h1>
  );
}

function Letter({ l, i, n, mx, my }: { l: string; i: number; n: number; mx: MotionValue<number>; my: MotionValue<number> }) {
  const pos = i / (n - 1) - 0.5;
  const x = useTransform(mx, (v) => (v - pos * 2) * -10 * (1 - Math.min(1, Math.abs(v - pos * 2))));
  const y = useTransform([mx, my], ([vx, vy]: number[]) => {
    const near = 1 - Math.min(1, Math.abs(vx - pos * 2) * 1.4);
    return near * near * vy * 34;
  });
  const sx = useSpring(x, { stiffness: 120, damping: 14 });
  const sy = useSpring(y, { stiffness: 120, damping: 14 });
  return (
    <motion.span aria-hidden="true" className="inline-block" initial={{ opacity: 0, y: 90, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.3 + i * 0.06, duration: 1.2, ease }}>
      <motion.span style={{ x: sx, y: sy }} className={`inline-block ${i >= 4 ? "mm-outline" : "text-ink"}`}>{l}</motion.span>
    </motion.span>
  );
}

function Door({ title, line, onClick, glyph, onHover, tone }: {
  title: string; line: string; onClick: () => void; glyph: React.ReactNode; onHover: (on: boolean) => void; tone: string;
}) {
  return (
    <Magnetic>
      <motion.button onClick={onClick} onHoverStart={() => onHover(true)} onHoverEnd={() => onHover(false)}
        whileTap={{ scale: 0.97 }}
        className="mm-glass group relative block w-full overflow-hidden rounded-[28px] p-6 text-left transition-colors hover:bg-white/[0.07] lg:p-7"
        data-cursor="open">
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
          style={{ background: tone }} />
        <span className="relative mb-10 grid h-12 w-12 place-items-center rounded-full border border-white/15 text-ink lg:mb-14">{glyph}</span>
        <span className="relative block font-display text-[2rem] leading-none text-ink lg:text-[2.4rem]">{title}</span>
        <span className="relative mt-3 block text-[14px] leading-relaxed text-soft">{line}</span>
        <span className="relative mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-ink/80">
          Enter
          <motion.span className="inline-block" initial={{ x: 0 }} whileHover={{ x: 4 }}>→</motion.span>
        </span>
      </motion.button>
    </Magnetic>
  );
}

const EyeGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" />
  </svg>
);
const VoiceGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 12h1M7.5 8.5v7M11 5v14M14.5 8v8M18 10.5v3M20.5 12H20" />
  </svg>
);
const FaceGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" /><path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.4" />
  </svg>
);
const PulseGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  </svg>
);

export default function Landing({ go }: { go: Go }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<Field | null>(null);
  const [section, setSection] = useState(0);
  const [name, setName] = useState("");
  const prefs = usePrefs();
  const online = useHubOnline();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    if (!canvas.current) return;
    let f: Field;
    try {
      f = createField(canvas.current);
    } catch {
      return; // no WebGL: the page still works, just without the field
    }
    field.current = f;
    return () => f.dispose();
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onScroll = () => {
      const h = window.innerHeight;
      const m = window.scrollY / h; // one screen per chapter
      field.current?.setMorph(Math.min(4, m));
      // the field steps back behind the doors at the end
      if (canvas.current) canvas.current.style.opacity = String(1 - Math.max(0, Math.min(1, (m - 3.4) / 0.6)) * 0.6);
      setSection(Math.min(4, Math.round(m)));
    };
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    lenis.on("scroll", onScroll);
    window.addEventListener("pointermove", onMove);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener("pointermove", onMove);
    };
  }, [mx, my]);

  async function enter(to: "preview" | "voice" | "face" | "checkin" | "home") {
    unlockAudio();
    const empty = (await db.checkins.count()) === 0;
    // Preview: look around first, with Asha's three weeks if there is nothing of yours yet.
    if (empty && (to === "preview" || (to === "home" && !prefs.welcomed))) await loadSample();
    if (!prefs.welcomed) setPrefs({ welcomed: true, name: name.trim() || prefs.name });
    else if (name.trim()) setPrefs({ name: name.trim() });
    go(to === "preview" ? "home" : to);
  }

  const scrollTo = (i: number) => window.scrollTo({ top: i * window.innerHeight, behavior: "smooth" });
  const hello = prefs.name ? `, ${prefs.name}` : "";

  return (
    <div className="night mm-grain relative min-h-screen overflow-x-clip text-ink">
      <Cursor />
      {/* the field */}
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-10 h-screen w-screen" aria-hidden="true" />
      {/* soft light behind the field */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true"
        style={{ background: "radial-gradient(60% 50% at 50% 55%, rgba(80,90,255,0.16), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(255,160,130,0.08), transparent 70%)" }} />

      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 lg:px-10">
        <button onClick={() => scrollTo(0)} className="flex items-center gap-2.5" data-cursor="">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 6.5a9.5 9.5 0 0 1 0 19z" fill="#a9b0ff" />
          </svg>
          <span className="font-display text-[21px] leading-none">MindMirror</span>
        </button>
        <nav className="hidden items-center gap-8 text-[13px] text-soft md:flex">
          {["How it works", "Your normal", "The mirror", "Begin"].map((l, i) => (
            <button key={l} onClick={() => scrollTo(i + 1)} className={`transition-colors hover:text-ink ${section === i + 1 ? "text-ink" : ""}`}>{l}</button>
          ))}
        </nav>
        <Magnetic>
          <button onClick={() => void enter("home")} className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-white hover:text-black">
            Open my mirror
          </button>
        </Magnetic>
      </header>

      {/* chapter rail */}
      <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} onClick={() => scrollTo(i)} className="group flex items-center justify-end gap-2" tabIndex={-1}>
            <span className={`text-[11px] tabular-nums transition-opacity ${section === i ? "opacity-70" : "opacity-0 group-hover:opacity-40"}`}>0{i}</span>
            <motion.span animate={{ height: section === i ? 22 : 6, opacity: section === i ? 1 : 0.35 }} className="block w-[2px] rounded-full bg-ink" />
          </button>
        ))}
      </div>

      <main className="relative z-20">
        {/* 0 · hero */}
        <section className="relative flex h-screen flex-col items-center justify-center px-4">
          <div className="absolute inset-x-0 top-[22%] z-0 lg:top-[18%]"><KineticName mx={mx} my={my} /></div>
          <div className="relative z-20 mt-[38vh] flex max-w-xl flex-col items-center text-center lg:mt-[44vh]">
            <motion.p className="text-[15px] leading-relaxed text-soft lg:text-[17px]" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.9, ease }}>
              Notice the <em className="font-display text-[1.25em] italic text-ink">drift</em> before it becomes a storm.
            </motion.p>
          </div>
          <motion.button onClick={() => scrollTo(1)} className="absolute bottom-8 flex flex-col items-center gap-3 text-[12px] tracking-[0.2em] text-faint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            SCROLL TO DIVE IN
            <span className="relative block h-10 w-px overflow-hidden bg-white/10">
              <motion.span className="absolute inset-x-0 top-0 h-4 bg-ink" animate={{ y: [-16, 40] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </motion.button>
        </section>

        {/* 1-3 · chapters */}
        {CHAPTERS.map((c, i) => (
          <section key={c.k} className={`flex h-screen items-center px-6 lg:px-24 ${i % 2 ? "justify-end text-right" : "justify-start"}`}>
            <div className="max-w-[560px]">
              <motion.p className="mb-5 font-mono text-[12px] tracking-[0.2em] text-faint" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ amount: 0.6 }}>{c.k} / 03</motion.p>
              <RevealWords text={c.title} className="font-display text-[2.9rem] leading-[1.02] lg:text-[4.6rem]" />
              <motion.p className="mt-6 text-[15px] leading-relaxed text-soft lg:text-[17px]" initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.6 }} transition={{ delay: 0.5, duration: 0.8, ease }}>
                {c.line}
              </motion.p>
            </div>
          </section>
        ))}

        {/* 4 · begin */}
        <section className="flex min-h-screen flex-col justify-center px-5 py-24 lg:px-16">
          <div className="mx-auto w-full max-w-[1120px]">
            <RevealWords text={`How are you, really${hello}?`} className="text-center font-display text-[3rem] leading-none lg:text-[5.6rem]" />
            <motion.p className="mx-auto mt-5 max-w-md text-center text-[15px] text-soft" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.5 }} transition={{ delay: 0.5 }}>
              Pick the way that fits how you feel right now. You can change any time.
            </motion.p>
            {!prefs.welcomed && (
              <motion.div className="mx-auto mt-8 max-w-sm" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.5 }} transition={{ delay: 0.7 }}>
                <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="Your first name (optional)"
                  className="mm-glass min-h-12 w-full rounded-full px-5 text-center text-[15px] outline-none placeholder:text-faint focus:border-white/40" />
              </motion.div>
            )}
            <motion.div className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-14 lg:gap-5"
              initial="hidden" whileInView="show" viewport={{ amount: 0.25, once: true }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
              {[
                { to: "preview" as const, title: "Preview", line: "Look around first. A sample three weeks shows how MindMirror notices you drifting.", glyph: <EyeGlyph />, tone: "#7fe0d0" },
                { to: "voice" as const, title: "Voice mode", line: "Just talk, to your phone or your necklace. A calm voice answers, and it counts.", glyph: <VoiceGlyph />, tone: "#6c7bff" },
                { to: "checkin" as const, title: "Check-in", line: "Thirty seconds, five sliders. See where you are against your own normal.", glyph: <PulseGlyph />, tone: "#ff9e80" },
              ].map((d) => (
                <motion.div key={d.to} variants={{ hidden: { opacity: 0, y: 40, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease } } }}>
                  <Door {...d} onClick={() => void enter(d.to)} onHover={(on) => field.current?.setPulse(on ? 0.6 : 0)} />
                </motion.div>
              ))}
            </motion.div>
            <motion.div className="mt-8 flex justify-center" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8, ease }}>
              <button onClick={() => void enter("face")} data-cursor="open"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 px-4 py-2 text-[13px] text-soft transition-colors hover:border-white/30 hover:text-ink">
                <span className="text-[#ff9e80]"><FaceGlyph /></span>
                or talk face to face with Reenu or Roman
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </motion.div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-faint">
              <button onClick={() => void enter("home")} className="underline-offset-4 hover:text-ink hover:underline">Open my mirror</button>
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[#8dbba6]" : "bg-white/25"}`} />
                {online ? "Necklace hub live" : "Works without the necklace too"}
              </span>
              <a href="tel:14416" className="hover:text-ink">Tele-MANAS 14416, free, 24×7</a>
            </div>
            <p className="mx-auto mt-6 max-w-lg text-center text-[11px] text-faint">MindMirror is a wellness companion, not a medical device. It never diagnoses.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
