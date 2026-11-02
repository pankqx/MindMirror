import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { chime, shred } from "./sound";

// Let it go: write a worry, hold the button, and watch the words come apart
// into embers that drift up and become stars. Nothing is saved.

interface P { x: number; y: number; vx: number; vy: number; life: number; delay: number; s: number; tw: number }

export default function Dissolve() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"write" | "hold" | "gone">("write");
  const [hold, setHold] = useState(0);
  const parts = useRef<P[]>([]);
  const stars = useRef<{ x: number; y: number; s: number; tw: number }[]>([]);
  const holding = useRef(false);
  const phase = useRef<"text" | "fly" | "rest">("rest");
  const word = useRef("");

  useEffect(() => {
    const c = canvas.current!;
    const g = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let W = 0, H = 0, raf = 0, t = 0;
    const size = () => {
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const frame = () => {
      t += 1 / 60;
      g.clearRect(0, 0, W, H);
      for (const s of stars.current) {
        const a = 0.35 + 0.35 * Math.sin(t * 1.5 + s.tw);
        g.fillStyle = `rgba(220,225,255,${a})`;
        g.beginPath(); g.arc(s.x, s.y, s.s, 0, Math.PI * 2); g.fill();
      }
      const ps = parts.current;
      if (phase.current !== "rest") {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          if (phase.current === "fly") {
            if (p.delay > 0) p.delay -= 1 / 60;
            else {
              p.vx += Math.sin(p.y * 0.02 + t * 2 + p.tw) * 0.05;
              p.vy -= 0.035;
              p.x += p.vx; p.y += p.vy;
              p.life -= 0.006;
              if (p.life <= 0) {
                if (Math.random() < 0.06) stars.current.push({ x: p.x, y: Math.max(10, p.y), s: 0.6 + Math.random() * 1.2, tw: Math.random() * 6 });
                ps.splice(i, 1);
                continue;
              }
            }
          } else if (holding.current) {
            // trembling while you hold
            p.x += (Math.random() - 0.5) * 0.6; p.y += (Math.random() - 0.5) * 0.6;
          }
          const k = p.delay > 0 || phase.current === "text" ? 1 : p.life;
          // white → ember orange → indigo as it rises
          const hue = (30 - (1 - k) * 130 + 360) % 360, light = 62 + k * 33;
          g.fillStyle = `hsla(${hue},100%,${light}%,${Math.min(1, k * 1.4)})`;
          g.fillRect(p.x, p.y, p.s, p.s);
        }
        if (phase.current === "fly" && ps.length === 0) {
          phase.current = "rest";
          chime(1);
          setStage("gone");
        }
      }
      if (stars.current.length > 160) stars.current.splice(0, stars.current.length - 160);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  /** Turn the words into particles by sampling the pixels of the drawn text. */
  function place(words: string) {
    const c = canvas.current!;
    const W = c.clientWidth, H = c.clientHeight;
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d")!;
    const fs = Math.max(26, Math.min(56, W / 14));
    o.font = `italic ${fs}px "Instrument Serif", serif`;
    o.fillStyle = "#fff";
    o.textAlign = "center";
    o.textBaseline = "middle";
    // wrap to lines
    const lines: string[] = [];
    let line = "";
    for (const w of words.split(" ")) {
      const test = line ? `${line} ${w}` : w;
      if (o.measureText(test).width > W * 0.8 && line) { lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
    lines.forEach((l, i) => o.fillText(l, W / 2, H * 0.42 + (i - (lines.length - 1) / 2) * fs * 1.15));
    const data = o.getImageData(0, 0, W, H).data;
    const ps: P[] = [];
    const gap = 2;
    for (let y = 0; y < H; y += gap)
      for (let x = 0; x < W; x += gap)
        if (data[(y * W + x) * 4 + 3] > 128)
          ps.push({ x, y, vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.6, life: 0.6 + Math.random() * 0.4, delay: (x / W) * 1.2 + Math.random() * 0.3, s: gap * 0.8, tw: Math.random() * 6 });
    parts.current = ps;
    phase.current = "text";
  }

  // holding the button fills the ring; at full, it lets go
  useEffect(() => {
    if (stage !== "hold") return;
    let raf = 0;
    const tick = () => {
      setHold((h) => {
        const n = holding.current ? Math.min(1, h + 0.012) : Math.max(0, h - 0.03);
        if (n >= 1 && phase.current === "text") {
          phase.current = "fly";
          holding.current = false;
          shred(1.2);
        }
        return n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const start = () => {
    if (!text.trim()) return;
    word.current = text.trim();
    place(word.current);
    setStage("hold");
    setHold(0);
  };

  const again = () => { setText(""); setStage("write"); setHold(0); };
  const R = 30, C = 2 * Math.PI * R;

  return (
    <div className="relative h-[62vh] min-h-[380px]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <AnimatePresence mode="wait">
        {stage === "write" && (
          <motion.form key="w" className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={(e) => { e.preventDefault(); start(); }}>
            <p className="text-[14px] text-soft">What's weighing on you? Nothing here is saved.</p>
            <input autoFocus value={text} onChange={(e) => setText(e.target.value.slice(0, 90))} placeholder="Write it here…"
              className="w-full max-w-lg border-b border-white/20 bg-transparent pb-3 text-center font-display text-[2rem] italic text-ink outline-none placeholder:text-faint focus:border-white/60" />
            <button disabled={!text.trim()} className="rounded-full bg-white px-7 py-3 text-[14px] font-semibold text-black transition-opacity disabled:opacity-30">
              Put it here
            </button>
          </motion.form>
        )}
        {stage === "hold" && (
          <motion.div key="h" className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button
              onPointerDown={() => (holding.current = true)} onPointerUp={() => (holding.current = false)} onPointerLeave={() => (holding.current = false)}
              className="relative grid h-[76px] w-[76px] touch-none select-none place-items-center rounded-full" aria-label="Hold to let it go">
              <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90">
                <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle cx="38" cy="38" r={R} fill="none" stroke="#ffb27a" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - hold)} />
              </svg>
              <span className="h-11 w-11 rounded-full bg-white/90" style={{ transform: `scale(${1 - hold * 0.2})` }} />
            </button>
            <p className="text-[13px] text-soft">Hold, breathe out slowly, and let it go.</p>
          </motion.div>
        )}
        {stage === "gone" && (
          <motion.div key="g" className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="max-w-sm font-display text-[2rem] leading-tight">It's still real, but it's lighter now.</p>
            <button onClick={again} className="rounded-full border border-white/20 px-6 py-2.5 text-[14px] font-medium transition-colors hover:bg-white hover:text-black">Let go of another</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
