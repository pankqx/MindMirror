// One shisha: a small round mirror held to the cloth by a ring of buttonhole stitches,
// a chain-stitch halo and, when there is something to say, satin-stitch petals.
// Drawn in SVG so it stays sharp at any size; the glint turns to face the pointer when asked.

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { THREAD } from "./palette";

export interface ShishaProps {
  size?: number | string;
  /** thread for the stitches around the mirror */
  thread?: string;
  /** second thread for petals and dots */
  accent?: string;
  /** 0 = just the mirror and its ring; 4..12 = petals around it */
  petals?: number;
  /** mirror radius inside the 100 x 100 box (10..22) */
  mirror?: number;
  /** an empty place on the cloth: a dotted outline where a mirror would go */
  empty?: boolean;
  /** stitch it in when it scrolls into view */
  draw?: boolean;
  /** turn the glint towards the pointer */
  follow?: boolean;
  delay?: number;
  className?: string;
  title?: string;
}

const TAU = Math.PI * 2;
const pt = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;

export function Shisha({ size = 64, thread = THREAD.rani, accent = THREAD.kesar, petals = 0, mirror = 15, empty, draw, follow, delay = 0, className = "", title }: ShishaProps) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [glint, setGlint] = useState(-2.2);

  useEffect(() => {
    if (!follow || reduce) return;
    const on = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setGlint(Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)));
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [follow, reduce]);

  const R = mirror;
  const ticks = Math.round(R * 1.7);
  const chainR = R + 8.5;
  const loops = Math.round((TAU * chainR) / 4.6);
  const anim = draw && !reduce;
  const reveal = (i: number) => anim
    ? { initial: { pathLength: 0, opacity: 0 }, whileInView: { pathLength: 1, opacity: 1 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.9, delay: delay + i * 0.12, ease: [0.22, 1, 0.36, 1] as const } }
    : {};

  if (empty) {
    return (
      <svg ref={ref} viewBox="-50 -50 100 100" width={size} height={size} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
        <circle r={R + 4} fill="none" stroke={thread} strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="2.5 3.5" />
      </svg>
    );
  }

  const g1 = pt(R * 0.66, glint - 0.55), g2 = pt(R * 0.66, glint + 0.35);
  const petalPaths = Array.from({ length: petals }, (_, i) => {
    const a = (i / petals) * TAU - Math.PI / 2;
    const w = Math.min(0.42, (TAU / petals) * 0.36);
    const [x0, y0] = pt(R + 12, a);
    const [x1, y1] = pt(R + 24, a - w);
    const [x2, y2] = pt(R + 30, a);
    const [x3, y3] = pt(R + 24, a + w);
    return `M${x0} ${y0} Q${x1} ${y1} ${x2} ${y2} Q${x3} ${y3} ${x0} ${y0}`;
  });
  const box = petals ? 50 : R + 13;

  return (
    <svg ref={ref} viewBox={`${-box} ${-box} ${box * 2} ${box * 2}`} width={size} height={size} className={className}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none" strokeLinecap="round">
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfcfd" />
          <stop offset="0.42" stopColor="#cdd3da" />
          <stop offset="0.58" stopColor="#8e97a4" />
          <stop offset="1" stopColor="#e3e7ec" />
        </linearGradient>
      </defs>
      {/* petals in satin stitch */}
      {petalPaths.map((d, i) => (
        <g key={i}>
          <motion.path d={d} stroke={accent} strokeWidth="1.4" {...reveal(2)} />
          <motion.path d={d} stroke={accent} strokeWidth="0.6" transform="scale(0.86)" opacity="0.7" {...reveal(2)} />
        </g>
      ))}
      {/* chain-stitch halo */}
      <motion.g {...(anim ? { initial: { opacity: 0, rotate: -20 }, whileInView: { opacity: 1, rotate: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 1, delay: delay + 0.15 } } : {})}>
        {Array.from({ length: loops }, (_, i) => {
          const a = (i / loops) * TAU;
          const [x, y] = pt(chainR, a);
          return <ellipse key={i} cx={x} cy={y} rx="2.1" ry="1.15" transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} stroke={thread} strokeWidth="0.9" />;
        })}
      </motion.g>
      {/* buttonhole stitches holding the mirror */}
      {Array.from({ length: ticks }, (_, i) => {
        const a = (i / ticks) * TAU;
        const [x0, y0] = pt(R + 0.6, a);
        const [x1, y1] = pt(R + 5.2, a);
        return <motion.line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={thread} strokeWidth="1.5" {...reveal(0)} />;
      })}
      <motion.circle r={R + 0.9} stroke={thread} strokeWidth="1.3" {...reveal(0)} />
      {/* the mirror */}
      <circle r={R} fill={`url(#${id}-m)`} stroke="#4b5260" strokeWidth="0.7" />
      <path d={`M${g1[0]} ${g1[1]} A${R * 0.66} ${R * 0.66} 0 0 1 ${g2[0]} ${g2[1]}`} stroke="#ffffff" strokeWidth="2.2" opacity="0.9"
        style={{ transition: "d 0.4s" }} />
      <circle cx={pt(R * 0.4, glint + 2.4)[0]} cy={pt(R * 0.4, glint + 2.4)[1]} r="1.1" fill="#ffffff" opacity="0.55" />
      {petals > 0 && Array.from({ length: petals }, (_, i) => {
        const [x, y] = pt(R + 30, ((i + 0.5) / petals) * TAU - Math.PI / 2);
        return <circle key={i} cx={x} cy={y} r="1.3" fill={thread} />;
      })}
    </svg>
  );
}
