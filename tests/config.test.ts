import { describe, expect, it } from "vitest";
import { ConfigError } from "../src/errors";
import { DEFAULT_CONFIG, deepMerge, mergeConfig, validateConfig } from "../src/config";

describe("config", () => {
  it("provides a default configuration with sensible values", () => {
    expect(DEFAULT_CONFIG.verdict.ready).toBe(80);
    expect(DEFAULT_CONFIG.verdict.needsWork).toBe(55);
    expect(DEFAULT_CONFIG.wave.points).toEqual({ trivial: 100, medium: 150, high: 200 });
    expect(DEFAULT_CONFIG.stellar).toBe(true);
  });

  it("merges partial overrides into the defaults", () => {
    const config = mergeConfig({
      verdict: { ready: 90 },
      labels: { goodFirstIssue: "good-first-issue" },
    });
    expect(config.verdict.ready).toBe(90);
    expect(config.verdict.needsWork).toBe(55);
    expect(config.labels.goodFirstIssue).toBe("good-first-issue");
    expect(config.labels.wave).toBe("Stellar Wave");
  });

  it("deep-merges nested objects without clobbering siblings", () => {
    const merged = deepMerge({ a: 1, nested: { x: 1, y: 2 } }, { nested: { x: 9 } } as never);
    expect(merged).toEqual({ a: 1, nested: { x: 9, y: 2 } });
  });

  it("rejects a config where verdict.ready is not greater than needsWork", () => {
    expect(() => mergeConfig({ verdict: { ready: 50, needsWork: 60 } })).toThrow(ConfigError);
  });

  it("rejects a config with a zero weight sum", () => {
    expect(() =>
      mergeConfig({
        weights: {
          clarity: 0,
          scope: 0,
          acceptance: 0,
          context: 0,
          guidance: 0,
          metadata: 0,
          stellar: 0,
        },
      }),
    ).toThrow(ConfigError);
  });

  it("accepts an empty (default) config without throwing", () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow();
  });
});
