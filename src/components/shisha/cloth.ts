// Turns check-ins into a cloth of mirrors: one mirror per day.
// The thread says how far that day sat from your own usual (the median of the days before it):
// mehendi = close to your usual, haldi = drifting, sindoor = far from it, khadi = still learning you.
// Mirror size follows sleep; petals follow energy. Pure functions, so they are tested.

import type { CheckIn } from "../../lib/db";
import { addDays, median } from "../../lib/signals";
import { THREAD } from "./palette";

export type DayTone = "steady" | "drift" | "far" | "learning" | "empty";

export interface ClothDay {
  date: string;
  tone: DayTone;
  thread: string;
  /** mirror radius in the 100 x 100 shisha box */
  mirror: number;
  petals: number;
  checkin?: CheckIn;
  /** a short plain sentence for the tooltip */
  line: string;
}

const MIN_DAYS = 5;

export const TONE_THREAD: Record<DayTone, string> = {
  steady: THREAD.mehendi,
  drift: THREAD.haldi,
  far: THREAD.sindoor,
  learning: THREAD.khadi,
  empty: THREAD.khadi,
};

/** How far one day sits from the usual (0 = right on it). Sleep counts in hours, the rest in steps of 1..5. */
export function distance(c: CheckIn, usual: { sleep: number; stress: number; energy: number; mood: number }) {
  const sleep = Math.max(0, usual.sleep - c.sleepHours); // only short nights count
  const stress = Math.max(0, c.stress - usual.stress);
  const energy = Math.max(0, usual.energy - c.energy);
  const mood = Math.max(0, usual.mood - c.mood);
  return Math.max(sleep / 1.2, stress, energy, mood);
}

export function weave(checkins: CheckIn[], today: string, days = 21): ClothDay[] {
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const out: ClothDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const c = byDate.get(date);
    if (!c) {
      out.push({ date, tone: "empty", thread: TONE_THREAD.empty, mirror: 12, petals: 0, line: "No check-in" });
      continue;
    }
    const before = sorted.filter((x) => x.date < date);
    let tone: DayTone = "learning";
    if (before.length >= MIN_DAYS) {
      const usual = {
        sleep: median(before.map((x) => x.sleepHours)),
        stress: median(before.map((x) => x.stress)),
        energy: median(before.map((x) => x.energy)),
        mood: median(before.map((x) => x.mood)),
      };
      const d = distance(c, usual);
      tone = d >= 1 ? "far" : d >= 0.5 ? "drift" : "steady";
    }
    const mirror = Math.round(10 + (Math.min(9, Math.max(3, c.sleepHours)) - 3) * 1.6);
    const words = { steady: "close to your usual", drift: "drifting from your usual", far: "far from your usual", learning: "still learning your usual", empty: "" };
    out.push({
      date, tone, thread: TONE_THREAD[tone], mirror, petals: c.energy * 2, checkin: c,
      line: `${c.sleepHours} h sleep, stress ${c.stress}/5, energy ${c.energy}/5: ${words[tone]}`,
    });
  }
  return out;
}
