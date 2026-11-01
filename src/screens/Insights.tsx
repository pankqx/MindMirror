import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowIcon } from "../components/Icons";
import SignalCard from "../components/SignalCard";
import { SignalGlyph } from "../components/Glyphs";
import { Card, item, list, PageHeader, SectionTitle, spring, TapCard } from "../components/ui";
import Weather from "../components/Weather";
import { copy } from "../content/copy";
import { db, localDate } from "../lib/db";
import type { Go } from "../lib/nav";
import { seriesFor } from "../lib/series";
import type { SignalKey } from "../lib/signals";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";

const CHARTS: { key: SignalKey; label: string; unit: string; domain: [number, number] }[] = [
  { key: "sleep", label: "Sleep", unit: "h", domain: [3, 10] },
  { key: "pressure", label: "Stress", unit: "/5", domain: [1, 5] },
  { key: "energy", label: "Energy", unit: "/5", domain: [1, 5] },
  { key: "drive", label: "Mood", unit: "/5", domain: [1, 5] },
];

// a different tip each day, so it doesn't feel canned
const dayIndex = Math.floor(Date.now() / 86400000);

export default function Insights({ go }: { go: Go }) {
  const ins = useInsights();
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const [chart, setChart] = useState<SignalKey>("sleep");

  if (!ins || !checkins) return null;
  const today = localDate();
  const w = copy.weather[ins.weather];
  const cfg = CHARTS.find((c) => c.key === chart)!;
  const sig = ins.signals.find((s) => s.key === chart);
  const data = seriesFor(chart, checkins, today, 21).map((p) => ({ day: p.date.slice(8), value: p.value }));
  const hasData = data.some((d) => d.value != null);
  const flagged = ins.signals.filter((s) => s.level === "watch" || s.level === "needs care").length;

  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <PageHeader eyebrow="Insights" title={<>You, compared with <em className="italic">you</em>.</>}
        lede="Your last 3 days against the 2 weeks before. Never against anyone else." />
      {ins.crisis && <motion.div variants={item} className="mb-6"><UrgentHelp /></motion.div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div className="space-y-6">
      <motion.div variants={item}>
        <Weather kind={ins.weather} title={ins.weatherTitle} message={w.line} />
      </motion.div>

      <motion.p variants={item} className="text-[15px] leading-relaxed text-soft">
        {ins.signals.every((s) => s.level === "learning")
          ? "MindMirror is learning your normal. After 5 check-ins, each signal compares your last few days with your own usual."
          : `${flagged === 0 ? "No signal" : flagged === 1 ? "One signal" : `${flagged} signals`} moved away from your usual. Tap a signal for one small thing to try.`}
      </motion.p>

      </div>
      <div>
      <motion.div variants={item}><SectionTitle>Your five signals</SectionTitle></motion.div>
      {ins.signals.map((s) => {
        const tips = copy.tips[s.key];
        return (
          <motion.div key={s.key} variants={item}>
            <SignalCard name={s.name} icon={<SignalGlyph k={s.key} size={26} />} level={s.level} proof={s.text}
              series={seriesFor(s.key, checkins, today, 21)} baseline={s.key === "connection" ? null : s.baseline}
              tip={tips[dayIndex % tips.length]} />
          </motion.div>
        );
      })}

      </div>
      </div>

      <motion.div variants={item} className="mt-10">
        <SectionTitle>Three weeks</SectionTitle>
        <Card className="!p-4 lg:!p-6">
          <div className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-card-2 p-1 lg:max-w-md">
            {CHARTS.map((c) => (
              <button key={c.key} onClick={() => setChart(c.key)}
                className={`relative min-h-9 rounded-full text-[13px] font-medium ${chart === c.key ? "text-bg" : "text-soft"}`}>
                {chart === c.key && <motion.span layoutId="chart-tab" transition={spring} className="absolute inset-0 rounded-full bg-ink" />}
                <span className="relative">{c.label}</span>
              </button>
            ))}
          </div>
          {hasData ? (
            <motion.div key={chart} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data} margin={{ left: -24, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--indigo)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--indigo)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--faint)" }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis domain={cfg.domain} tick={{ fontSize: 10, fill: "var(--faint)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, color: "var(--ink)" }}
                    formatter={(v) => [`${v} ${cfg.unit}`, cfg.label]} labelFormatter={(l) => `Day ${l}`} />
                  {sig?.baseline != null && (
                    <ReferenceLine y={sig.baseline} stroke="var(--sage)" strokeDasharray="6 4" strokeWidth={2}
                      label={{ value: "your usual", fontSize: 10, fill: "var(--soft)", position: "insideTopRight" }} />
                  )}
                  <Area type="monotone" dataKey="value" stroke="var(--indigo)" strokeWidth={2} fill="url(#fill)" connectNulls
                    dot={false} activeDot={{ r: 5 }} animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <p className="py-10 text-center text-sm text-soft">Check in for a few days to see your line.</p>
          )}
        </Card>
      </motion.div>

      <motion.div variants={item} className="mt-6 grid grid-cols-2 gap-3">
        <TapCard onClick={() => go("support")} className="!p-4">
          <span className="text-[13px] text-faint">Step {ins.rung.step} of 4</span>
          <span className="mt-1 block font-display text-2xl">{ins.rung.title}</span>
          <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-indigo">Support <ArrowIcon size={16} /></span>
        </TapCard>
        <TapCard onClick={() => go("planner")} className="!p-4">
          <span className="text-[13px] text-faint">Pressure</span>
          <span className="mt-1 block font-display text-2xl">Deadlines vs hours</span>
          <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-indigo">Planner <ArrowIcon size={16} /></span>
        </TapCard>
      </motion.div>

      <motion.p variants={item} className="mt-8 text-xs text-faint">
        MindMirror shows changes against your own normal. It is not a medical device and does not diagnose.
      </motion.p>
    </motion.div>
  );
}
