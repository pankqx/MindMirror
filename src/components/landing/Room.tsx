// A room of the landing. Rooms stack: when you reach the end of one, it holds still and the
// next slides up over it, while the old one sinks back and dims (the contentarchitecture.dev seam,
// done with plain sticky positioning so it works on phones too).
// A zero-height anchor sits before each room, so the nav can scroll to its true position.

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Room({ id, children, className = "", sink = true }: { id: string; children: ReactNode; className?: string; sink?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setTop(Math.min(0, window.innerHeight - el.offsetHeight));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["end end", "end start"] });
  const scale = useTransform(p, [0, 1], [1, 0.93]);
  const dim = useTransform(p, [0, 1], [0, 0.7]);
  const live = sink && !reduce;

  return (
    <>
      <div id={id} data-anchor={id} className="pointer-events-none relative h-0" aria-hidden="true" />
      <section ref={ref} data-room={id} className={`sticky overflow-x-clip bg-neel-deep ${className}`} style={{ top }}>
        <motion.div className="origin-bottom" style={live ? { scale } : undefined}>{children}</motion.div>
        {live && <motion.div className="pointer-events-none absolute inset-0 z-[5] bg-neel-deep" style={{ opacity: dim }} aria-hidden="true" />}
      </section>
    </>
  );
}
