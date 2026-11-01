import { describe, expect, it } from "vitest";
import { sampleData } from "./sample";
import { computeInsights } from "./signals";

describe("sample data (the demo story)", () => {
  it("shows Asha in Soft rain with sleep needing care", () => {
    const today = "2026-11-02";
    const { checkins, voice, tasks } = sampleData(today);
    const ins = computeInsights(checkins, voice, tasks, today);
    const lv = Object.fromEntries(ins.signals.map((s) => [s.key, s.level]));
    expect(lv.sleep).toBe("needs care");
    expect(ins.signals.find((s) => s.key === "sleep")!.text).toContain("5.4 h");
    expect(ins.weatherTitle).toBe("Soft rain");
    expect(ins.crisis).toBe(false);
    console.log(ins.signals.map((s) => `${s.name}: ${s.level} | ${s.text}`).join("\n"));
  });
});
