import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Words rise out of blur one by one when they scroll into view. */
export function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h2 className={className} initial="hidden" whileInView="show" viewport={{ amount: 0.6 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span className="inline-block"
            variants={{ hidden: { y: "105%", opacity: 0, filter: "blur(10px)" }, show: { y: "0%", opacity: 1, filter: "blur(0px)", transition: { duration: 0.9, ease } } }}>
            {w}{i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

/** Pulls its child gently towards the cursor. */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });
  return (
    <motion.div ref={ref} style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.div>
  );
}

/** A soft ring that trails the mouse and opens up over anything clickable. Mouse only. */
export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 }), sy = useSpring(y, { stiffness: 500, damping: 40 });
  const [hover, setHover] = useState(false);
  const [fine] = useState(() => window.matchMedia("(pointer: fine)").matches);
  useEffect(() => {
    if (!fine) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest("button, a, input, [data-cursor]"));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [fine, x, y]);
  if (!fine) return null;
  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-[70] mix-blend-difference" style={{ x: sx, y: sy }} aria-hidden="true">
      <motion.div className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white"
        animate={{ width: hover ? 54 : 18, height: hover ? 54 : 18, backgroundColor: hover ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }} />
    </motion.div>
  );
}

/** Round back button used in the immersive rooms. */
export function BackPill({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="mm-glass flex h-10 items-center gap-2 rounded-full pl-3 pr-4 text-[13px] font-medium text-ink transition-colors hover:bg-white/10">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      {label}
    </button>
  );
}
