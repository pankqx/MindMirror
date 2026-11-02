// The landing page's small building blocks: line reveals, the split mono button, chips, scrolling.

import Lenis from "lenis";
import { motion, useReducedMotion } from "framer-motion";
import { createElement, useEffect, useState, type ReactNode } from "react";

export const ease = [0.22, 1, 0.36, 1] as const;

let lenis: Lenis | null = null;

/** Smooth scrolling while the landing is open. Off for reduced motion. */
export function useLenis() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, [reduce]);
}

/** Scroll to a section by id (the URL hash is the app's router, so we never touch it). */
export function scrollToId(id: string) {
  const el = id === "top" ? document.body : document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { duration: 1.4 });
  else window.scrollTo({ top: id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
}

/** A heading whose lines rise out of their own masks. Split lines with "\n". */
export function Lines({ text, as = "h2", className = "", delay = 0 }: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const lines = text.split("\n");
  return createElement(
    as,
    { className, "aria-label": text.replace(/\n/g, " ") },
    lines.map((l, i) => (
      <span key={i} className="block overflow-hidden pb-[0.06em]" aria-hidden="true">
        <motion.span className="block"
          initial={reduce ? { opacity: 0 } : { y: "105%" }}
          whileInView={reduce ? { opacity: 1 } : { y: "0%" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease, delay: delay + i * 0.08 }}>
          {l}
        </motion.span>
      </span>
    )),
  );
}

/** Fades and lifts a block in, once. */
export function Fade({ children, className = "", delay = 0, y = 16 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={{ opacity: 0, y: reduce ? 0 : y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease, delay }}>
      {children}
    </motion.div>
  );
}

type Tone = "coal" | "paper" | "mist" | "glow" | "ghost";
const TONES: Record<Tone, string> = {
  coal: "bg-coal text-paper",
  paper: "bg-paper text-coal",
  mist: "bg-mist text-coal",
  glow: "bg-glow text-coal",
  ghost: "bg-white/10 text-white",
};

/**
 * The house button: each word sits in its own block, and on hover every word rolls
 * up to a fresh copy of itself, one after another.
 */
export function Btn({ children, onClick, href, tone = "coal", className = "", label }: {
  children: string; onClick?: () => void; href?: string; tone?: Tone; className?: string; label?: string;
}) {
  const words = children.split(" ");
  const inner = words.map((w, i) => (
    <span key={i} className={`relative flex h-12 items-center overflow-hidden px-4 ${TONES[tone]} first:rounded-l-[3px] last:rounded-r-[3px]`}>
      <span className="block transition-transform duration-500 ease-(--ease-lp) group-hover:-translate-y-[150%] motion-reduce:transition-none"
        style={{ transitionDelay: `${i * 45}ms` }}>{w}</span>
      <span aria-hidden="true" className="absolute inset-x-4 block translate-y-[150%] transition-transform duration-500 ease-(--ease-lp) group-hover:translate-y-0 motion-reduce:transition-none"
        style={{ transitionDelay: `${i * 45}ms` }}>{w}</span>
    </span>
  ));
  const cls = `group t-caption inline-flex w-fit shrink-0 cursor-pointer select-none gap-[2px] whitespace-nowrap active:scale-[0.98] transition-transform ${className}`;
  if (href) {
    const ext = href.startsWith("http");
    return <a href={href} className={cls} aria-label={label ?? children} {...(ext ? { target: "_blank", rel: "noreferrer" } : {})}>{inner}</a>;
  }
  return <button type="button" onClick={onClick} className={cls} aria-label={label ?? children}>{inner}</button>;
}

/** A small mono label in a soft box. */
export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`t-caption-sm inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-[3px] px-1.5 py-1 ${className}`}>{children}</span>;
}

/** MindMirror's mark: a ring with half a moon of light. */
export function Mark({ size = 22, ring = "currentColor", fill = "#a9b0ff" }: { size?: number; ring?: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke={ring} strokeWidth="2" />
      <path d="M16 6.5a9.5 9.5 0 0 1 0 19z" fill={fill} />
    </svg>
  );
}

/** A live dot that pings. */
export function Ping({ className = "bg-glow" }: { className?: string }) {
  return (
    <span className="relative flex size-1.5" aria-hidden="true">
      <span className={`lp-ping absolute inline-flex size-full rounded-full ${className}`} />
      <span className={`relative inline-flex size-1.5 rounded-full ${className}`} />
    </span>
  );
}

/** True while a media query matches (e.g. the laptop layout). */
export function useMedia(query: string) {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const fn = () => setOn(m.matches);
    fn();
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, [query]);
  return on;
}
