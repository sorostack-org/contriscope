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

  const fileMatches = [...haystack.matchAll(/(\d+)\s*\+?\s*files?\b/g)].map((match) =>
    Number.parseInt(match[1], 10),
  );
  if (fileMatches.length > 0) {
    const largest = Math.max(...fileMatches);
    if (largest >= 5) {
      score += 3;
      signals.push(`size: ~${largest} files`);
    } else if (largest >= 3) {
      score += 2;
      signals.push(`size: ~${largest} files`);
    } else if (largest === 2) {
      score += 1;
      signals.push(`size: ~2 files`);
    } else {
      score -= 1;
      signals.push(`size: ~1 file`);
    }
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

  const signalCount = highHits.length + mediumHits.length + trivialHits.length + signals.length;
  const bodyLength = input.body.trim().length;
  let confidence = Math.min(1, signalCount / 6 + (bodyLength > 300 ? 0.3 : 0));
  if (bodyLength === 0) {
    confidence = 0.1;
  }
  confidence = Math.round(confidence * 100) / 100;

  const reasoning = buildReasoning(level, score, highHits, mediumHits, trivialHits);

  return { level, points, signals, reasoning, confidence };
}

function buildReasoning(
  level: WaveLevel,
  score: number,
  highHits: string[],
  mediumHits: string[],
  trivialHits: string[],
): string {
  const parts: string[] = [];
  if (highHits.length > 0) {
    parts.push(`matches high-complexity signals (${highHits.slice(0, 3).join(", ")})`);
  }
  if (mediumHits.length > 0) {
    parts.push(`matches medium-complexity signals (${mediumHits.slice(0, 3).join(", ")})`);
  }
  if (trivialHits.length > 0) {
    parts.push(`matches trivial-complexity signals (${trivialHits.slice(0, 3).join(", ")})`);
  }
  if (parts.length === 0) {
    parts.push("no strong complexity signals found");
  }
  const verdict = `Suggested level: ${level.toUpperCase()} (weighted score ${score}).`;
  return `${verdict} This suggestion is based on ${parts.join("; ")}. Review it before assigning points.`;
}
