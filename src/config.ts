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
