import { describe, expect, it } from "vitest";
import { sampleData } from "../../lib/sample";
import { weave } from "./cloth";

describe("the cloth", () => {
  const today = "2026-11-02";
  const { checkins } = sampleData(today);
  const cloth = weave(checkins, today, 21);

  it("has one place per day, oldest first", () => {
    expect(cloth).toHaveLength(21);
    expect(cloth[20].date).toBe(today);
    expect(cloth[0].date < cloth[20].date).toBe(true);
  });

  it("learns before it judges", () => {
    const first = cloth.find((d) => d.checkin);
    expect(first?.tone).toBe("learning");
  });

  it("shows Asha's short last nights as far from her usual", () => {
    const last3 = cloth.slice(-3).filter((d) => d.checkin);
    expect(last3.length).toBeGreaterThan(0);
    expect(last3.every((d) => d.tone === "far" || d.tone === "drift")).toBe(true);
    expect(last3.some((d) => d.tone === "far")).toBe(true);
  });

  it("keeps her usual weeks mostly steady", () => {
    const usual = cloth.slice(6, 17).filter((d) => d.checkin);
    const steady = usual.filter((d) => d.tone === "steady").length;
    expect(steady / usual.length).toBeGreaterThan(0.5);
  });
});
