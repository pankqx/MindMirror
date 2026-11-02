import { motion } from "framer-motion";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { Signal } from "../lib/signals";

// "You now vs your normal": the five signals on one shape. Every axis is scaled so
// further out = better (more sleep, more energy, better mood, calmer, more connected),
// so a drift shows as the shape pulling in on one side.

const AXES: { key: Signal["key"]; label: string; score: (v: number) => number }[] = [
  { key: "sleep", label: "Sleep", score: (h) => (h / 9) * 100 },
  { key: "energy", label: "Energy", score: (v) => (v / 5) * 100 },
  { key: "drive", label: "Mood", score: (v) => (v / 5) * 100 },
  { key: "pressure", label: "Calm", score: (v) => ((6 - v) / 5) * 100 },
  { key: "connection", label: "Connection", score: (p) => p },
];

const clamp = (x: number) => Math.max(4, Math.min(100, Math.round(x)));

export default function NormalRadar({ signals }: { signals: Signal[] }) {
  const rows = AXES.map((a) => {
    const s = signals.find((x) => x.key === a.key);
    return { axis: a.label, now: s?.recent != null ? clamp(a.score(s.recent)) : null, normal: s?.baseline != null ? clamp(a.score(s.baseline)) : null };
  });
  if (rows.some((r) => r.now == null || r.normal == null)) return null;
  const furthest = [...rows].sort((a, b) => (a.now! - a.normal!) - (b.now! - b.normal!))[0];

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={rows} outerRadius="68%" margin={{ top: 8, right: 34, bottom: 8, left: 34 }}>
            <defs>
              <radialGradient id="now-fill" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="var(--indigo)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--indigo)" stopOpacity={0.42} />
              </radialGradient>
            </defs>
            <PolarGrid stroke="var(--line)" gridType="circle" />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: "var(--soft)" }} />
            <Radar name="Your normal" dataKey="normal" stroke="var(--sage)" strokeWidth={2} strokeDasharray="5 4" fill="var(--sage)" fillOpacity={0.1}
              animationDuration={900} />
            <Radar name="Last 3 days" dataKey="now" stroke="var(--indigo)" strokeWidth={2.4} fill="url(#now-fill)"
              dot={{ r: 3.5, fill: "var(--indigo)", strokeWidth: 0 }} animationBegin={300} animationDuration={1300} />
          </RadarChart>
        </ResponsiveContainer>
        {/* a slow pulse in the middle: the mirror breathing */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo"
          animate={{ scale: [1, 2.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px] text-soft">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-sage" />your normal</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-indigo/50" />last 3 days</span>
        </span>
        {furthest.now! < furthest.normal! - 4 && <span>Pulled in most: <b className="font-semibold text-ink">{furthest.axis.toLowerCase()}</b></span>}
      </div>
    </div>
  );
}
