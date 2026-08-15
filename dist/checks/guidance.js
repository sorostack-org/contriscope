"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGuidance = checkGuidance;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
const STACK_MARKERS = [
    "react",
    "typescript",
    "javascript",
    "rust",
    "soroban",
    "stellar-sdk",
    "stellar sdk",
    "sdk",
    "api",
    "cli",
    "contract",
    "next.js",
    "nextjs",
    "npm",
    "docker",
    "graphql",
    "postgres",
    "redis",
    "vitest",
    "jest",
    "node",
    "web3",
    "seps",
    "xlm",
];
const VALIDATION_MARKERS = [
    "verify",
    "validate",
    "ensure",
    "edge case",
    "watch out",
    "note",
    "careful",
    "run",
    "check",
    "how to test",
    "how to verify",
    "manual test",
];
function checkGuidance(input) {
    const { title, body } = input;
    const findings = [];
    const haystack = `${title} ${body}`;
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    const files = (0, text_1.extractFileReferences)(haystack);
    if (files.length === 0) {
        add((0, helpers_1.makeFinding)("guidance.no-files", "guidance", "warning", "No implementation pointers", "The issue does not point contributors to the files or modules involved.", "List the key files, functions, or packages that will be touched."));
    }
    if (!(0, text_1.hasAny)(haystack, STACK_MARKERS)) {
        add((0, helpers_1.makeFinding)("guidance.no-stack", "guidance", "info", "Technology stack not mentioned", "The issue does not mention the technologies involved, which slows down scoping.", "Name the stack, e.g. TypeScript + @stellar/stellar-sdk + Soroban."));
    }
    if (!(0, text_1.hasAny)(haystack, VALIDATION_MARKERS)) {
        add((0, helpers_1.makeFinding)("guidance.no-validation", "guidance", "info", "Validation approach not described", "The issue does not say how the change will be validated.", 'Add a line such as "Run `npm test` and verify the new flow on Testnet".'));
    }
    return { score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
