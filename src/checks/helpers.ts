import type { Finding, Severity } from "../types";

export function severityPenalty(severity: Severity): number {
  switch (severity) {
    case "error":
      return 25;
    case "warning":
      return 12;
    case "info":
      return 0;
  }
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function makeFinding(
  id: string,
  dimension: Finding["dimension"],
  severity: Severity,
  title: string,
  message: string,
  suggestion?: string,
): Finding {
  return { id, dimension, severity, title, message, suggestion };
}
