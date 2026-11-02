// The landing's motion helpers: one easing curve, smooth scrolling, and a media-query hook.

import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

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
