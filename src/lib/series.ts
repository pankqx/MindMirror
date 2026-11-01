// Daily values for the little trend lines on each signal. Pure, no React.

import type { CheckIn } from "./db";
import { addDays, type SignalKey } from "./signals";

export interface Point {
  date: string;
  value: number | null;
}

const VALUE: Record<SignalKey, (c: CheckIn) => number> = {
  sleep: (c) => c.sleepHours,
  pressure: (c) => c.stress,
  connection: (c) => (c.connected ? 1 : 0),
  energy: (c) => c.energy,
  drive: (c) => c.mood,
};

/** The last `days` days for one signal (null where there was no check-in). */
export function seriesFor(key: SignalKey, checkins: CheckIn[], today: string, days = 21): Point[] {
  const latest = new Map<string, CheckIn>();
  for (const c of [...checkins].sort((a, b) => a.at.localeCompare(b.at))) latest.set(c.date, c);
  const out: Point[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const c = latest.get(date);
    out.push({ date, value: c ? VALUE[key](c) : null });
  }
  return out;
}

/** Consecutive days with a check-in, counting back from today (or yesterday). */
export function streak(checkins: CheckIn[], today: string): number {
  const dates = new Set(checkins.map((c) => c.date));
  let d = dates.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (dates.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
