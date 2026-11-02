// The signal engine. Code calculates, AI only explains.
// Pure functions: no React, no Dexie, so everything here is unit tested.

import type { CheckIn, Task, VoiceTurn } from "./db";
import { isCrisis, LADDER, type Rung, type Weather } from "./support";

export type Level = "steady" | "watch" | "needs care" | "learning";
export type SignalKey = "sleep" | "pressure" | "connection" | "energy" | "drive";

export interface Signal {
  key: SignalKey;
  name: string;
  icon: string;
  level: Level;
  text: string; // the proof sentence shown under the signal
  recent: number | null;
  baseline: number | null;
}

export interface Insights {
  signals: Signal[];
  score: number;
  weather: Weather;
  weatherTitle: string;
  rung: Rung;
  crisis: boolean;
}

const MIN_BASELINE_DAYS = 5;

// ---------- dates ----------

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Dates from `today - from` to `today - to` (inclusive, from >= to). */
function dateRange(today: string, from: number, to: number): Set<string> {
  const s = new Set<string>();
  for (let i = from; i >= to; i--) s.add(addDays(today, -i));
  return s;
}

// ---------- maths ----------

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const f1 = (x: number) => r1(x).toFixed(1);
const signed = (x: number, unit = "") => `${x < 0 ? "−" : "+"}${f1(Math.abs(x))}${unit}`;

/** One check-in per date (the latest wins). */
function byDate(checkins: CheckIn[]): Map<string, CheckIn> {
  const m = new Map<string, CheckIn>();
  for (const c of [...checkins].sort((a, b) => a.at.localeCompare(b.at))) m.set(c.date, c);
  return m;
}

function pick(days: Map<string, CheckIn>, dates: Set<string>): CheckIn[] {
  return [...dates].map((d) => days.get(d)).filter((c): c is CheckIn => !!c);
}

/** Lower is worse (sleep, energy, mood): how far below baseline. */
function levelDrop(diff: number, watch: number, care: number): Level {
  if (diff <= -care) return "needs care";
  if (diff <= -watch) return "watch";
  return "steady";
}

/** Higher is worse (stress). */
function levelRise(diff: number, watch: number, care: number): Level {
  if (diff >= care) return "needs care";
  if (diff >= watch) return "watch";
  return "steady";
}

const RANK: Record<Level, number> = { learning: 0, steady: 0, watch: 1, "needs care": 2 };
const worst = (a: Level, b: Level): Level => (RANK[b] > RANK[a] ? b : a);

// ---------- the five signals ----------

interface Ctx {
  today: string;
  days: Map<string, CheckIn>;
  base: CheckIn[]; // days 4..17 ago
  recent3: CheckIn[]; // last 3 days (today, yesterday, the day before)
  recent4: CheckIn[]; // last 4 days
  voice: VoiceTurn[];
  tasks: Task[];
}

function learning(key: SignalKey, name: string, icon: string, why: string): Signal {
  return { key, name, icon, level: "learning", text: why, recent: null, baseline: null };
}

function notEnough(c: Ctx): string | null {
  if (c.base.length < MIN_BASELINE_DAYS)
    return `Learning your normal: ${c.base.length} of ${MIN_BASELINE_DAYS} days so far.`;
  if (c.recent3.length === 0) return "No check-ins in the last 3 days yet.";
  return null;
}

function sleepSignal(c: Ctx): Signal {
  const [key, name, icon] = ["sleep", "Sleep", "\u{1F319}"] as const;
  const why = notEnough(c);
  if (why) return learning(key, name, icon, why);
  const baseline = median(c.base.map((x) => x.sleepHours));
  const recent = mean(c.recent3.map((x) => x.sleepHours));
  const diff = recent - baseline;
  return {
    key, name, icon, recent: r1(recent), baseline: r1(baseline),
    level: levelDrop(diff, 0.75, 1.5),
    text: `You slept ${f1(recent)} h on average the last ${c.recent3.length} nights; your usual is ${f1(baseline)} h (${signed(diff, " h")}).`,
  };
}

function energySignal(c: Ctx): Signal {
  const [key, name, icon] = ["energy", "Energy", "⚡"] as const;
  const why = notEnough(c);
  if (why) return learning(key, name, icon, why);
  const baseline = median(c.base.map((x) => x.energy));
  const recent = mean(c.recent3.map((x) => x.energy));
  const diff = recent - baseline;
  return {
    key, name, icon, recent: r1(recent), baseline: r1(baseline),
    level: levelDrop(diff, 0.75, 1.25),
    text: `Your energy was ${f1(recent)} of 5 the last ${c.recent3.length} days; your usual is ${f1(baseline)} (${signed(diff)}).`,
  };
}

function pressureSignal(c: Ctx): Signal {
  const [key, name, icon] = ["pressure", "Pressure", "\u{1F4DA}"] as const;
  const why = notEnough(c);
  if (why) return learning(key, name, icon, why);
  const baseline = median(c.base.map((x) => x.stress));
  const recent = mean(c.recent3.map((x) => x.stress));
  const diff = recent - baseline;
  let level = levelRise(diff, 0.75, 1.25);
  let text = `Your stress was ${f1(recent)} of 5 the last ${c.recent3.length} days; your usual is ${f1(baseline)} (${signed(diff)}).`;

  // Planner: work due in the next 3 days vs hours planned for it.
  const soon = dateRange(addDays(c.today, 2), 2, 0);
  const dueSoon = c.tasks.filter((t) => !t.done && soon.has(t.due));
  const needed = dueSoon.reduce((a, t) => a + t.hoursNeeded, 0);
  const planned = dueSoon.reduce((a, t) => a + t.hoursPlanned, 0);
  if (needed > planned) {
    const planLevel: Level = needed > 1.5 * planned ? "needs care" : "watch";
    level = worst(level, planLevel);
    text += ` Work due in the next 3 days needs ${f1(needed)} h; you've planned ${f1(planned)} h.`;
  }
  return { key, name, icon, level, text, recent: r1(recent), baseline: r1(baseline) };
}

function connectionSignal(c: Ctx): Signal {
  const [key, name, icon] = ["connection", "Connection", "\u{1F91D}"] as const;
  const why = notEnough(c);
  if (why) return learning(key, name, icon, why);
  const share = (xs: CheckIn[]) => (100 * xs.filter((x) => x.connected).length) / xs.length;
  const baseline = share(c.base);
  const recent = share(c.recent4);
  const yes = c.recent4.filter((x) => x.connected).length;
  const drop = recent - baseline;
  return {
    key, name, icon, recent: Math.round(recent), baseline: Math.round(baseline),
    level: levelDrop(drop, 25, 50),
    text: `You talked to someone you like on ${yes} of the last ${c.recent4.length} days (${Math.round(recent)}%); usually ${Math.round(baseline)}% of days.`,
  };
}

function driveSignal(c: Ctx): Signal {
  const [key, name, icon] = ["drive", "Drive", "\u{1F331}"] as const;
  const why = notEnough(c);
  if (why) return learning(key, name, icon, why);
  const baseline = median(c.base.map((x) => x.mood));
  const recent = mean(c.recent3.map((x) => x.mood));
  const diff = recent - baseline;
  return {
    key, name, icon, recent: r1(recent), baseline: r1(baseline),
    level: levelDrop(diff, 0.75, 1.25),
    text: `Your mood was ${f1(recent)} of 5 the last ${c.recent3.length} days; your usual is ${f1(baseline)} (${signed(diff)}).`,
  };
}

// ---------- what you said out loud ----------

// Every voice turn (necklace or voice mode) comes back from the hub tagged with
// the topics it touched. Saying it counts too: once lifts the matching signal to
// "watch", twice or more in 3 days to "needs care", and the proof says so.
export const VOICE_TAG: Record<SignalKey, { tag: string; about: string }> = {
  sleep: { tag: "sleep", about: "your sleep" },
  pressure: { tag: "pressure", about: "pressure and deadlines" },
  connection: { tag: "isolation", about: "feeling alone" },
  energy: { tag: "energy", about: "feeling tired" },
  drive: { tag: "motivation", about: "motivation" },
};

function withVoice(s: Signal, c: Ctx): Signal {
  const { tag, about } = VOICE_TAG[s.key];
  const last3 = dateRange(c.today, 2, 0);
  const n = c.voice.filter((v) => last3.has(v.at.slice(0, 10)) && v.signals.includes(tag)).length;
  if (n === 0) return s;
  const said = `You told MindMirror about ${about} ${n === 1 ? "once" : `${n} times`} in the last 3 days.`;
  const level = worst(s.level === "learning" ? "steady" : s.level, n >= 2 ? "needs care" : "watch");
  return { ...s, level, text: `${s.text} ${said}` };
}

// ---------- weather ----------

export function weatherFor(score: number): { weather: Weather; title: string } {
  if (score <= 1) return { weather: "clear", title: "Clear skies" };
  if (score <= 3) return { weather: "clouds", title: "Passing clouds" };
  if (score <= 5) return { weather: "rain", title: "Soft rain" };
  return { weather: "storm", title: "Heavy skies" };
}

export function scoreOf(signals: Signal[]): number {
  return signals.reduce((a, s) => a + RANK[s.level], 0);
}

// ---------- main entry ----------

export function computeInsights(
  checkins: CheckIn[],
  voice: VoiceTurn[],
  tasks: Task[],
  today: string,
): Insights {
  const days = byDate(checkins);
  const ctx: Ctx = {
    today,
    days,
    base: pick(days, dateRange(today, 17, 4)),
    recent3: pick(days, dateRange(today, 2, 0)),
    recent4: pick(days, dateRange(today, 3, 0)),
    voice,
    tasks,
  };
  const signals = [sleepSignal(ctx), pressureSignal(ctx), connectionSignal(ctx), energySignal(ctx), driveSignal(ctx)].map((s) => withVoice(s, ctx));
  const score = scoreOf(signals);
  const { weather, title } = weatherFor(score);

  const last3 = dateRange(today, 2, 0);
  const crisis =
    ctx.recent3.some((c) => isCrisis(c.note)) ||
    voice.some((v) => last3.has(v.at.slice(0, 10)) && isCrisis(v.heard));

  return { signals, score, weather, weatherTitle: title, rung: LADDER[weather], crisis };
}

/** Proof sentences of signals that need attention, for the companion's context. */
export function contextFor(ins: Insights): string {
  return ins.signals
    .filter((s) => s.level === "watch" || s.level === "needs care")
    .map((s) => `${s.name} (${s.level}): ${s.text}`)
    .join("\n");
}
