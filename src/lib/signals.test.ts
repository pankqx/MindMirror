import { describe, expect, it } from "vitest";
import type { CheckIn, VoiceTurn } from "./db";
import { addDays, computeInsights, scoreOf, weatherFor, type Signal } from "./signals";
import { isCrisis } from "./support";

const TODAY = "2026-11-01";

function day(daysAgo: number, over: Partial<CheckIn> = {}): CheckIn {
  const date = addDays(TODAY, -daysAgo);
  return {
    date, at: `${date}T20:00:00.000Z`,
    mood: 4, stress: 2, energy: 4, sleepHours: 7, connected: true, source: "tap",
    ...over,
  };
}

/** `n` steady days, from 17 days ago towards today. */
function steady(n = 18): CheckIn[] {
  return Array.from({ length: n }, (_, i) => day(17 - i));
}

const sleep = (s: Signal[]) => s.find((x) => x.key === "sleep")!;

describe("signal engine", () => {
  it("1. says 'learning your normal' with fewer than 5 baseline days", () => {
    const data = [day(6), day(5), day(4), day(2), day(1), day(0)];
    const ins = computeInsights(data, [], [], TODAY);
    for (const s of ins.signals) expect(s.level).toBe("learning");
    expect(sleep(ins.signals).text).toMatch(/Learning your normal/);
  });

  it("2. flags sleep as needs care after 3 short nights, with the proof", () => {
    const data = [
      ...steady().filter((c) => c.date < addDays(TODAY, -2)),
      day(2, { sleepHours: 5.4 }), day(1, { sleepHours: 5.4 }), day(0, { sleepHours: 5.4 }),
    ];
    const s = sleep(computeInsights(data, [], [], TODAY).signals);
    expect(s.level).toBe("needs care");
    expect(s.recent).toBe(5.4);
    expect(s.baseline).toBe(7);
    expect(s.text).toContain("−1.6 h");
  });

  it("3. one bad night in the usual weeks does not move the baseline (median)", () => {
    const data = steady().map((c) => (c.date === addDays(TODAY, -10) ? { ...c, sleepHours: 2 } : c));
    const s = sleep(computeInsights(data, [], [], TODAY).signals);
    expect(s.baseline).toBe(7);
    expect(s.level).toBe("steady");
  });

  it("4. five signals at needs care make Heavy skies", () => {
    const care = Array.from({ length: 5 }, () => ({ level: "needs care" }) as Signal);
    const score = scoreOf(care);
    expect(score).toBe(10);
    expect(weatherFor(score).title).toBe("Heavy skies");

    // and through the real engine
    const data = [
      ...steady().filter((c) => c.date < addDays(TODAY, -3)),
      ...[3, 2, 1, 0].map((d) => day(d, { sleepHours: 4.5, stress: 5, energy: 1, mood: 1, connected: false })),
    ];
    const ins = computeInsights(data, [], [], TODAY);
    expect(ins.signals.every((s) => s.level === "needs care")).toBe(true);
    expect(ins.weatherTitle).toBe("Heavy skies");
    expect(ins.rung.step).toBe(4);
  });

  it("5. crisis words set the crisis flag", () => {
    expect(isCrisis("I want to die")).toBe(true);
    expect(isCrisis("I'm dying to sleep, this assignment is killing me")).toBe(false);
    const data = [...steady().slice(0, -1), day(0, { note: "I want to die" })];
    expect(computeInsights(data, [], [], TODAY).crisis).toBe(true);
  });

  it("drive needs care with 2+ 'motivation' voice tags in 3 days", () => {
    const turn = (d: number): VoiceTurn => ({
      at: `${addDays(TODAY, -d)}T10:00:00.000Z`, heard: "", reply: "", mood: "low", signals: ["motivation"], source: "necklace",
    });
    const ins = computeInsights(steady(), [turn(1), turn(0)], [], TODAY);
    expect(ins.signals.find((s) => s.key === "drive")!.level).toBe("needs care");
  });

  it("one necklace turn about sleep lifts sleep to watch, with proof", () => {
    const turn: VoiceTurn = {
      at: `${TODAY}T08:00:00.000Z`, heard: "I slept four hours", reply: "", mood: "tired", signals: ["sleep", "pressure"], source: "necklace",
    };
    const ins = computeInsights(steady(), [turn], [], TODAY);
    const sleep = ins.signals.find((s) => s.key === "sleep")!;
    expect(sleep.level).toBe("watch");
    expect(sleep.text).toMatch(/You told MindMirror about your sleep once/);
    expect(ins.signals.find((s) => s.key === "pressure")!.level).toBe("watch");
    expect(ins.signals.find((s) => s.key === "connection")!.level).toBe("steady");
  });

  it("voice turns count even while the app is still learning your normal", () => {
    const turn = (h: number): VoiceTurn => ({
      at: `${TODAY}T0${h}:00:00.000Z`, heard: "", reply: "", mood: "low", signals: ["isolation"], source: "necklace",
    });
    const ins = computeInsights([], [turn(1), turn(2)], [], TODAY);
    expect(ins.signals.find((s) => s.key === "connection")!.level).toBe("needs care");
  });

  it("planner overload raises pressure", () => {
    const tasks = [{ title: "DBMS record", due: addDays(TODAY, 1), hoursNeeded: 6, hoursPlanned: 2, done: false }];
    const ins = computeInsights(steady(), [], tasks, TODAY);
    const p = ins.signals.find((s) => s.key === "pressure")!;
    expect(p.level).toBe("needs care");
    expect(p.text).toMatch(/needs 6.0 h; you've planned 2.0 h/);
  });

  it("steady data gives Clear skies", () => {
    const ins = computeInsights(steady(), [], [], TODAY);
    expect(ins.weatherTitle).toBe("Clear skies");
    expect(ins.crisis).toBe(false);
  });
});
