"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.deepMerge = deepMerge;
exports.validateConfig = validateConfig;
exports.mergeConfig = mergeConfig;
exports.loadConfigFile = loadConfigFile;
exports.loadConfig = loadConfig;
exports.pickConfigPath = pickConfigPath;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const errors_1 = require("./errors");
exports.DEFAULT_CONFIG = {
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
function deepMerge(base, overrides) {
    if (Array.isArray(base) || Array.isArray(overrides)) {
        return (overrides === undefined ? base : overrides);
    }
    if (typeof base === "object" &&
        base !== null &&
        typeof overrides === "object" &&
        overrides !== null) {
        const result = { ...base };
        for (const key of Object.keys(overrides)) {
            const baseValue = base[key];
            const overrideValue = overrides[key];
            if (overrideValue === undefined) {
                continue;
            }
            if (typeof baseValue === "object" &&
                baseValue !== null &&
                !Array.isArray(baseValue) &&
                typeof overrideValue === "object" &&
                overrideValue !== null &&
                !Array.isArray(overrideValue)) {
                result[key] = deepMerge(baseValue, overrideValue);
            }
            else {
                result[key] = overrideValue;
            }
        }
        return result;
    }
    return (overrides === undefined ? base : overrides);
}
function validateConfig(config) {
    if (typeof config.program !== "object" || config.program === null) {
        throw new errors_1.ConfigError("`program` must be an object.");
    }
    const weightIds = [
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
        throw new errors_1.ConfigError("The sum of `weights` must be greater than zero.");
    }
    for (const [name, value] of Object.entries(config.verdict)) {
        if (typeof value !== "number" || value < 0 || value > 100) {
            throw new errors_1.ConfigError(`verdict.${name} must be a number between 0 and 100.`);
        }
    }
    if (config.verdict.ready <= config.verdict.needsWork) {
        throw new errors_1.ConfigError("`verdict.ready` must be greater than `verdict.needsWork`.");
    }
    if (!Array.isArray(config.vagueTerms) || config.vagueTerms.length === 0) {
        throw new errors_1.ConfigError("`vagueTerms` must be a non-empty array.");
    }
    if (!Array.isArray(config.wave.highSignals)) {
        throw new errors_1.ConfigError("`wave.highSignals` must be an array.");
    }
}
function mergeConfig(overrides, base = exports.DEFAULT_CONFIG) {
    const merged = overrides ? deepMerge(base, overrides) : base;
    validateConfig(merged);
    return merged;
}
function loadConfigFile(path) {
    let raw;
    try {
        raw = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(path), "utf8");
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new errors_1.ConfigError(`Unable to read config file "${path}": ${detail}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new errors_1.ConfigError(`Config file "${path}" is not valid JSON: ${detail}`);
    }
    return mergeConfig(parsed);
}
function loadConfig(path) {
    if (!path) {
        return { config: exports.DEFAULT_CONFIG };
    }
    return { config: loadConfigFile(path), path: (0, node_path_1.resolve)(path) };
}
function pickConfigPath(candidates) {
    for (const candidate of candidates) {
        try {
            (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(candidate), "utf8");
            return candidate;
        }
        catch {
            // continue
        }
    }
    return undefined;
}
