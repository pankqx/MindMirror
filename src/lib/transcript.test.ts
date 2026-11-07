import { describe, expect, it } from "vitest";
import { joinResults } from "./transcript";
import { offlineReply } from "./offline";

describe("joinResults", () => {
  it("does not repeat words when Android sends growing results", () => {
    expect(joinResults(["I", "I am", "I am tired today"])).toBe("I am tired today");
  });
  it("joins separate phrases", () => {
    expect(joinResults(["what is the capital", " of France"])).toBe("what is the capital of France");
  });
  it("drops an exact repeat", () => {
    expect(joinResults(["tell me a joke", "tell me a joke"])).toBe("tell me a joke");
  });
});

describe("offlineReply", () => {
  it("never says the same line twice in a row", () => {
    expect(offlineReply("hello")).not.toBe(offlineReply("hello"));
  });
});
