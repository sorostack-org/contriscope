import { extractFileReferences, hasAny } from "../text";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

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

export interface GuidanceInput {
  title: string;
  body: string;
}

export function checkGuidance(input: GuidanceInput): { score: number; findings: Finding[] } {
  const { title, body } = input;
  const findings: Finding[] = [];
  const haystack = `${title} ${body}`;
  let penalty = 0;

  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  const files = extractFileReferences(haystack);
  if (files.length === 0) {
    add(
      makeFinding(
        "guidance.no-files",
        "guidance",
        "warning",
        "No implementation pointers",
        "The issue does not point contributors to the files or modules involved.",
        "List the key files, functions, or packages that will be touched.",
      ),
    );
  }

  if (!hasAny(haystack, STACK_MARKERS)) {
    add(
      makeFinding(
        "guidance.no-stack",
        "guidance",
        "info",
        "Technology stack not mentioned",
        "The issue does not mention the technologies involved, which slows down scoping.",
        "Name the stack, e.g. TypeScript + @stellar/stellar-sdk + Soroban.",
      ),
    );
  }

  if (!hasAny(haystack, VALIDATION_MARKERS)) {
    add(
      makeFinding(
        "guidance.no-validation",
        "guidance",
        "info",
        "Validation approach not described",
        "The issue does not say how the change will be validated.",
        'Add a line such as "Run `npm test` and verify the new flow on Testnet".',
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
