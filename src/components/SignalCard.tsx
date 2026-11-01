import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Point } from "../lib/series";
import { Pill, spring } from "./ui";

// Kishore's signal card: name, level and the proof sentence.
// Now with a tiny trend line (recent days vs your usual) and a tap to open a tip.

type SignalLevel = "steady" | "watch" | "needs care" | "learning";

type SignalCardProps = {
  name: string;
  icon: React.ReactNode;
  level: SignalLevel;
  proof: string;
  series?: Point[];
  baseline?: number | null;
  tip?: string;
  /** Higher is worse (stress). Used to colour the trend. */
  invert?: boolean;
};

const tone = { steady: "sage", watch: "sun", "needs care": "coral", learning: "neutral" } as const;
const stroke = { steady: "var(--sage)", watch: "var(--sun)", "needs care": "var(--coral)", learning: "var(--faint)" };

export function Sparkline({ series, baseline, level }: { series: Point[]; baseline?: number | null; level: SignalLevel }) {
  const vals = series.map((p) => p.value).filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const W = 120, H = 36;
  const lo = Math.min(...vals, baseline ?? Infinity);
  const hi = Math.max(...vals, baseline ?? -Infinity);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (v: number) => H - 4 - ((v - lo) / span) * (H - 8);
  let d = "";
  series.forEach((p, i) => {
    if (p.value == null) return;
    d += `${d ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)} `;
  });
  const lastI = series.map((p) => p.value != null).lastIndexOf(true);
  const last = series[lastI]?.value ?? null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-28 overflow-visible" aria-hidden="true">
      {baseline != null && (
        <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} stroke="var(--faint)" strokeDasharray="3 3" strokeWidth="1" opacity="0.7" />
      )}
      <motion.path d={d} fill="none" stroke={stroke[level]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      {last != null && (
        <motion.circle cx={x(lastI)} cy={y(last)} r="3.2" fill={stroke[level]} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}
          transition={{ delay: 1.1, duration: 0.5 }} />
      )}
    </svg>
  );
}

export default function SignalCard({ name, icon, level, proof, series, baseline, tip }: SignalCardProps) {
  const [open, setOpen] = useState(false);
  const canOpen = !!tip && level !== "learning";

  return (
    <motion.div layout transition={spring} className="border-b border-line last:border-b-0">
      <button type="button" disabled={!canOpen} onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="group block w-full py-5 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="text-ink">{icon}</span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-medium text-ink">{name}</h3>
              <Pill tone={tone[level]}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: stroke[level] }} />
                {level}
              </Pill>
            </div>
          </div>
          {series && level !== "learning" && <Sparkline series={series} baseline={baseline} level={level} />}
        </div>

        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-soft">{proof}</p>
        {canOpen && !open && <p className="mt-2 text-[13px] font-medium text-faint transition-colors group-hover:text-indigo">One small thing to try</p>}
      </button>

      <AnimatePresence initial={false}>
        {open && tip && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="mb-5 border-l-2 border-sage pl-4 font-display text-[1.35rem] italic leading-snug text-ink">{tip}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
