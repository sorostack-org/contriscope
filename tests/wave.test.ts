import { describe, expect, it } from "vitest";
import { suggestWaveComplexity } from "../src/wave";
import { DEFAULT_CONFIG } from "../src/config";

describe("suggestWaveComplexity", () => {
  it("suggests trivial for a typo fix", () => {
    const result = suggestWaveComplexity({
      config: DEFAULT_CONFIG,
      title: "Fix the typo in the README",
      body: "Correct the spelling mistake in the error message.",
    });
    expect(result.level).toBe("trivial");
    expect(result.points).toBe(100);
  });

  it("suggests medium for a standard feature touching an auth flow", () => {
    const result = suggestWaveComplexity({
      config: DEFAULT_CONFIG,
      title: "Add SEP-10 authentication helper",
      body: "Implement an authenticateWithAnchor helper in src/lib/sep10.ts. Unit tests cover the happy path and edge cases.",
    });
    expect(result.level).toBe("medium");
    expect(result.points).toBe(150);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("suggests high for an integration or architectural change", () => {
    const result = suggestWaveComplexity({
      config: DEFAULT_CONFIG,
      title: "Refactor the payment pipeline",
      body: "Migrate the payment processing across the entire codebase and integrate the new soroban contract with the SDK.",
    });
    expect(result.level).toBe("high");
    expect(result.points).toBe(200);
  });

  it("returns low confidence for an empty body", () => {
    const result = suggestWaveComplexity({
      config: DEFAULT_CONFIG,
      title: "Do something",
      body: "",
    });
    expect(result.confidence).toBeLessThanOrEqual(0.2);
  });

  it("respects configured point values", () => {
    const config = DEFAULT_CONFIG;
    const result = suggestWaveComplexity({
      config,
      title: "Fix typo",
      body: "Fix the spelling mistake in a comment.",
    });
    expect(result.points).toBe(config.wave.points.trivial);
  });

  it("produces a reasoning string", () => {
    const result = suggestWaveComplexity({
      config: DEFAULT_CONFIG,
      title: "Add a feature",
      body: "Implement a new dashboard with filtering and sorting.",
    });
    expect(result.reasoning.length).toBeGreaterThan(20);
  });
});
