import { describe, expect, it } from "vitest";
import {
  formatDigitalDuration,
  parseDigitalDuration,
} from "../utils/duration";

describe("digital duration", () => {
  it("converts MM:SS to seconds", () => {
    expect(parseDigitalDuration("20:00")).toBe(1200);
    expect(parseDigitalDuration("01:30")).toBe(90);
  });

  it("rejects invalid seconds and zero duration", () => {
    expect(parseDigitalDuration("20:60")).toBeNull();
    expect(parseDigitalDuration("20")).toBeNull();
    expect(parseDigitalDuration("00:00")).toBeNull();
  });

  it("formats seconds as MM:SS", () => {
    expect(formatDigitalDuration(1200)).toBe("20:00");
    expect(formatDigitalDuration(90)).toBe("01:30");
  });
});
