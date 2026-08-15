import type { ContriscopeConfig } from "./config";
import type { WaveLevel, WaveSuggestion } from "./types";

export interface WaveInput {
  config: ContriscopeConfig;
  title: string;
  body: string;
}

export function suggestWaveComplexity(input: WaveInput): WaveSuggestion {
  const { config } = input;
  const haystack = `${input.title} ${input.body}`.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  const highHits = config.wave.highSignals.filter((signal) => haystack.includes(signal));
  const mediumHits = config.wave.mediumSignals.filter((signal) => haystack.includes(signal));
  const trivialHits = config.wave.trivialSignals.filter((signal) => haystack.includes(signal));

  for (const signal of highHits) {
    score += 2;
    signals.push(`high: ${signal}`);
  }
  for (const signal of mediumHits) {
    score += 1;
    signals.push(`medium: ${signal}`);
  }
  for (const signal of trivialHits) {
    score -= 1;
    signals.push(`trivial: ${signal}`);
  }

  score = Math.max(-3, Math.min(10, score));

  let level: WaveLevel;
  if (score >= 5) {
    level = "high";
  } else if (score >= 2) {
    level = "medium";
  } else {
    level = "trivial";
  }

  const points = config.wave.points[level];

  return {
    level,
    points,
    signals,
    reasoning: `Suggested level: ${level.toUpperCase()} (weighted score ${score}).`,
    confidence: 0.5,
  };
}
