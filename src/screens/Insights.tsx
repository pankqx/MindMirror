import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NormalRadar from "../components/NormalRadar";
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
import { useFresh } from "../lib/fresh";
import UrgentHelp from "./UrgentHelp";
import { Cloth } from "../components/shisha/Cloth";
import { weave } from "../components/shisha/cloth";

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
  const fresh = useFresh();

  if (!ins || !checkins) return null;
  const today = localDate();
  const w = copy.weather[ins.weather];
  const cfg = CHARTS.find((c) => c.key === chart)!;
  const sig = ins.signals.find((s) => s.key === chart);
  const data = seriesFor(chart, checkins, today, 21).map((p) => ({ day: p.date.slice(8), value: p.value }));
  // "your normal" as a soft band around the usual value, and the last 3 days lit up
  const half = chart === "sleep" ? 0.75 : 0.5;
  const band = sig?.baseline != null ? [sig.baseline - half, sig.baseline + half] as const : null;
  const off = (v: number | null) => band != null && v != null && (v < band[0] || v > band[1]);
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

      <motion.div variants={item} className="on-neel rounded-[10px] bg-[#171b38] p-5 lg:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="t-caption-sm text-soft">Your cloth · last 21 days</p>
          <p className="t-caption-sm text-faint">one mirror a day</p>
        </div>
        <Cloth days={weave(checkins, today, 21)} />
      </motion.div>

      {ins.signals.every((s) => s.recent != null && s.baseline != null) && (
        <motion.div variants={item}>
          <Card className="!p-4 lg:!p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="t-caption-sm text-soft">You now vs your normal</p>
              <p className="t-caption-sm text-faint">further out = better</p>
            </div>
            <NormalRadar signals={ins.signals} />
          </Card>
        </motion.div>
      )}

      </div>
      <div>
      <motion.div variants={item}><SectionTitle>Your five signals</SectionTitle></motion.div>
      {ins.signals.map((s) => {
        const tips = copy.tips[s.key];
        return (
          <motion.div key={s.key} variants={item}>
            <SignalCard name={s.name} icon={<SignalGlyph k={s.key} size={26} />} level={s.level} proof={s.text}
              series={seriesFor(s.key, checkins, today, 21)} baseline={s.key === "connection" ? null : s.baseline}
              tip={tips[dayIndex % tips.length]}
              heard={fresh.turn && fresh.keys.has(s.key) ? { text: fresh.turn.heard, source: fresh.turn.source } : null} />
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
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ left: -24, right: 14, top: 14 }}>
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--indigo)" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="var(--indigo)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--faint)" />
                      <stop offset="70%" stopColor="var(--indigo)" />
                      <stop offset="100%" stopColor="var(--coral)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="2 6" />
                  {band && (
                    <ReferenceArea y1={band[0]} y2={band[1]} fill="var(--sage)" fillOpacity={0.14} stroke="none" />
                  )}
                  {data.length >= 3 && (
                    <ReferenceArea x1={data[data.length - 3].day} x2={data[data.length - 1].day} fill="var(--sun)" fillOpacity={0.12} stroke="none" />
                  )}
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--faint)" }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis domain={cfg.domain} tick={{ fontSize: 10, fill: "var(--faint)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ stroke: "var(--indigo)", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, color: "var(--ink)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                    formatter={(v) => [`${v} ${cfg.unit}`, cfg.label]} labelFormatter={(l) => `Day ${l}`} />
                  {sig?.baseline != null && (
                    <ReferenceLine y={sig.baseline} stroke="var(--sage)" strokeDasharray="6 4" strokeWidth={1.5} />
                  )}
                  <Area type="monotone" dataKey="value" stroke="url(#line)" strokeWidth={3} fill="url(#fill)" connectNulls
                    dot={(p: { cx?: number; cy?: number; index?: number; payload?: { value: number | null } }) => {
                      const v = p.payload?.value ?? null;
                      if (p.cx == null || p.cy == null || v == null) return <g key={p.index} />;
                      const drift = off(v);
                      return (
                        <g key={p.index}>
                          {drift && <circle cx={p.cx} cy={p.cy} r={9} fill="var(--coral)" opacity={0.18} />}
                          <circle cx={p.cx} cy={p.cy} r={drift ? 4.5 : 2.6} fill={drift ? "var(--coral)" : "var(--card)"} stroke={drift ? "var(--card)" : "var(--indigo)"} strokeWidth={drift ? 1.5 : 1.6} />
                        </g>
                      );
                    }}
                    activeDot={{ r: 6, fill: "var(--indigo)", stroke: "var(--card)", strokeWidth: 2 }} animationDuration={1400} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-soft">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-sage/30" />your normal</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-coral" />outside your normal</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-sun/25" />last 3 days</span>
              </p>
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
