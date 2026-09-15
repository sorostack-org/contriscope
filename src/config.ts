import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigError } from "./errors";
import type { DimensionId } from "./types";

export interface Weights {
  clarity: number;
  scope: number;
  acceptance: number;
  context: number;
  guidance: number;
  metadata: number;
  stellar: number;
}

export interface ContriscopeConfig {
  program: {
    wave: boolean;
    grantfox: boolean;
  };
  stellar: boolean;
  weights: Weights;
  verdict: {
    ready: number;
    needsWork: number;
  };
  minDescriptionLength: number;
  minBodyWords: number;
  title: {
    min: number;
    max: number;
  };
  vagueTerms: string[];
  placeholderTokens: string[];
  largeScopePhrases: string[];
  labels: {
    goodFirstIssue: string;
    wave: string;
    complexity: {
      trivial: string;
      medium: string;
      high: string;
    };
  };
  wave: {
    points: {
      trivial: number;
      medium: number;
      high: number;
    };
    highSignals: string[];
    mediumSignals: string[];
    trivialSignals: string[];
  };
  repo: {
    minReadmeLength: number;
    goodFirstIssueTarget: number;
  };
}

export const DEFAULT_CONFIG: ContriscopeConfig = {
  program: {
    wave: true,
    grantfox: true,
  },
  stellar: true,
  weights: {
    clarity: 0.25,
    scope: 0.25,
    acceptance: 0.2,
    context: 0.15,
    guidance: 0.1,
    metadata: 0.05,
    stellar: 0.05,
  },
  verdict: {
    ready: 80,
    needsWork: 55,
  },
  minDescriptionLength: 100,
  minBodyWords: 20,
  title: {
    min: 8,
    max: 80,
  },
  vagueTerms: [
    "improve",
    "improvement",
    "clean up",
    "cleanup",
    "fix stuff",
    "fix things",
    "tweak",
    "asap",
    "something",
    "somewhere",
    "whatever",
    "tbd",
    "todo",
    "etc",
  ],
  placeholderTokens: ["lorem ipsum", "placeholder", "fixme", "xxx", "yyy", "...", "???", "!!!"],
  largeScopePhrases: [
    "rewrite everything",
    "rewrite the entire",
    "rewrite the whole",
    "entire codebase",
    "whole codebase",
    "all the things",
    "rearchitect",
    "big bang",
  ],
  labels: {
    goodFirstIssue: "good first issue",
    wave: "Stellar Wave",
    complexity: {
      trivial: "complexity: trivial",
      medium: "complexity: medium",
      high: "complexity: high",
    },
  },
  wave: {
    points: {
      trivial: 100,
      medium: 150,
      high: 200,
    },
    highSignals: [
      "refactor",
      "migrat",
      "integr",
      "architect",
      "cross-cutting",
      "end-to-end",
      "across the",
      "entire",
      "breaking change",
      "backward compatib",
      "performance",
      "security",
      "multisig",
      "indexer",
      "realtime",
      "websocket",
      "protocol",
      "soroban contract",
      "smart contract",
      "token standard",
      "governance",
      "sponsored",
      "escrow",
      "federation",
      "sdk integration",
    ],
    mediumSignals: [
      "feature",
      "implement",
      "add support",
      "endpoint",
      "api",
      "ui",
      "component",
      "state management",
      "form",
      "validate",
      "paginate",
      "filter",
      "sort",
      "auth",
      "middleware",
      "hook",
      "dashboard",
      "cli",
      "command",
      "database",
      "schema",
      "webhook",
    ],
    trivialSignals: [
      "typo",
      "typos",
      "bump",
      "update dependency",
      "upgrade dependency",
      "small fix",
      "minor",
      "one-line",
      "rename",
      "clarif",
      "add comment",
      "add doc",
      "documentation",
      "copy",
      "grammar",
      "spelling",
      "error message",
      "broken link",
      "format",
      "prettier",
      "lint",
    ],
  },
  repo: {
    minReadmeLength: 400,
    goodFirstIssueTarget: 3,
  },
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  if (Array.isArray(base) || Array.isArray(overrides)) {
    return (overrides === undefined ? base : overrides) as unknown as T;
  }
  if (
    typeof base === "object" &&
    base !== null &&
    typeof overrides === "object" &&
    overrides !== null
  ) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(overrides as Record<string, unknown>)) {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = (overrides as Record<string, unknown>)[key];
      if (overrideValue === undefined) {
        continue;
      }
      if (
        typeof baseValue === "object" &&
        baseValue !== null &&
        !Array.isArray(baseValue) &&
        typeof overrideValue === "object" &&
        overrideValue !== null &&
        !Array.isArray(overrideValue)
      ) {
        result[key] = deepMerge(baseValue, overrideValue as DeepPartial<typeof baseValue>);
      } else {
        result[key] = overrideValue;
      }
    }
    return result as unknown as T;
  }
  return (overrides === undefined ? base : overrides) as unknown as T;
}

export function validateConfig(config: ContriscopeConfig): void {
  if (typeof config.program !== "object" || config.program === null) {
    throw new ConfigError("`program` must be an object.");
  }
  const weightIds: DimensionId[] = [
    "clarity",
    "scope",
    "acceptance",
    "context",
    "guidance",
    "metadata",
    "stellar",
  ];
  const total = weightIds.reduce((sum, id) => sum + (config.weights[id] ?? 0), 0);
  if (total <= 0) {
    throw new ConfigError("The sum of `weights` must be greater than zero.");
  }
  for (const [name, value] of Object.entries(config.verdict)) {
    if (typeof value !== "number" || value < 0 || value > 100) {
      throw new ConfigError(`verdict.${name} must be a number between 0 and 100.`);
    }
  }
  if (config.verdict.ready <= config.verdict.needsWork) {
    throw new ConfigError("`verdict.ready` must be greater than `verdict.needsWork`.");
  }
  if (!Array.isArray(config.vagueTerms) || config.vagueTerms.length === 0) {
    throw new ConfigError("`vagueTerms` must be a non-empty array.");
  }
  if (!Array.isArray(config.wave.highSignals)) {
    throw new ConfigError("`wave.highSignals` must be an array.");
  }
}

export function mergeConfig(
  overrides?: DeepPartial<ContriscopeConfig>,
  base: ContriscopeConfig = DEFAULT_CONFIG,
): ContriscopeConfig {
  const merged = overrides ? deepMerge(base, overrides) : base;
  validateConfig(merged);
  return merged;
}

export interface LoadedConfig {
  config: ContriscopeConfig;
  path?: string;
}

export function loadConfigFile(path: string): ContriscopeConfig {
  let raw: string;
  try {
    raw = readFileSync(resolve(path), "utf8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Unable to read config file "${path}": ${detail}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Config file "${path}" is not valid JSON: ${detail}`);
  }
  return mergeConfig(parsed as DeepPartial<ContriscopeConfig>);
}

export function loadConfig(path?: string): LoadedConfig {
  if (!path) {
    return { config: DEFAULT_CONFIG };
  }
  return { config: loadConfigFile(path), path: resolve(path) };
}

export function pickConfigPath(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    try {
      readFileSync(resolve(candidate), "utf8");
      return candidate;
    } catch {
      // continue
    }
  }
  return undefined;
}
