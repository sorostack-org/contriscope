import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

function hasLabel(labels: string[] | undefined, expected: string): boolean {
  if (!labels) {
    return false;
  }
  const lower = expected.toLowerCase();
  return labels.some(
    (label) => label.toLowerCase() === lower || label.toLowerCase().includes(lower),
  );
}

export interface MetadataInput {
  config: ContriscopeConfig;
  labels?: string[];
}

export function checkMetadata(input: MetadataInput): { score: number; findings: Finding[] } {
  const { config, labels } = input;
  const findings: Finding[] = [];
  let penalty = 0;

  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  if (labels === undefined) {
    add(
      makeFinding(
        "metadata.labels.unknown",
        "metadata",
        "info",
        "Labels are not available",
        "Label data is missing, so metadata checks were limited.",
        "Add labels in GitHub (e.g. `bug`, `good first issue`, `complexity: medium`).",
      ),
    );
    return { score: clampScore(100 - penalty), findings };
  }

  if (labels.length === 0) {
    add(
      makeFinding(
        "metadata.labels.none",
        "metadata",
        "warning",
        "No labels",
        "The issue has no labels, making it harder for contributors to filter and assess it.",
        "Add at least a type label (`bug`, `enhancement`, `docs`) and a complexity label.",
      ),
    );
  }

  const hasComplexityLabel = labels.some(
    (label) =>
      label.toLowerCase().startsWith("complexity") ||
      ["trivial", "medium", "high"].some((level) => label.toLowerCase() === level),
  );
  if (config.program.wave && !hasComplexityLabel) {
    add(
      makeFinding(
        "metadata.labels.complexity-missing",
        "metadata",
        "warning",
        "No complexity label",
        "Drips Wave requires a complexity level for each issue (Trivial / Medium / High).",
        `Add a label such as \`${config.labels.complexity.medium}\` or tag the complexity in the Wave dashboard.`,
      ),
    );
  }

  if (config.program.wave && !hasLabel(labels, config.labels.wave)) {
    add(
      makeFinding(
        "metadata.labels.wave-missing",
        "metadata",
        "info",
        "Wave label not applied",
        "Adding the Wave label is the GitHub-native way to include an issue in a Wave program.",
        `Add the \`${config.labels.wave}\` label (once the repository is approved for the Wave program).`,
      ),
    );
  }

  if (!hasLabel(labels, config.labels.goodFirstIssue)) {
    add(
      makeFinding(
        "metadata.labels.good-first-missing",
        "metadata",
        "info",
        "No 'good first issue' label",
        "Beginner-friendly issues benefit from a dedicated label to attract first-time contributors.",
        `Add the \`${config.labels.goodFirstIssue}\` label if the task is small and well-bounded.`,
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
