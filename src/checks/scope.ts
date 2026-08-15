import { countOccurrences, extractFileReferences, hasAny } from "../text";
import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

const SCOPE_CREEP_CONJUNCTIONS = [
  "and also",
  "in addition",
  "additionally",
  "as well as",
  "moreover",
  "on top of that",
];

const SIZE_INDICATORS = [
  "estimate",
  "estimated",
  "should take",
  "roughly",
  "approximately",
  "single wave",
  "one sprint",
  "one cycle",
  "within a week",
  "within this wave",
  "~",
  "hours",
  "days",
];

export interface ScopeInput {
  config: ContriscopeConfig;
  title: string;
  body: string;
}

export function checkScope(input: ScopeInput): { score: number; findings: Finding[] } {
  const { config, title, body } = input;
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
        "scope.no-file-reference",
        "scope",
        "warning",
        "No file or module references",
        "The issue does not reference any files, modules, or packages, so its scope is hard to estimate.",
        "Point contributors at the relevant files or modules, e.g. `src/checks/scope.ts` or `@stellar/stellar-sdk`.",
      ),
    );
  }

  for (const phrase of config.largeScopePhrases) {
    if (body.toLowerCase().includes(phrase)) {
      add(
        makeFinding(
          "scope.large",
          "scope",
          "warning",
          `Large-scope wording: "${phrase}"`,
          `The description uses "${phrase}", which suggests the task is too large for one issue or one wave.`,
          "Split the work into smaller, independently shippable issues.",
        ),
      );
    }
  }

  const conjunctions = countOccurrences(body, SCOPE_CREEP_CONJUNCTIONS);
  if (conjunctions >= 3) {
    add(
      makeFinding(
        "scope.creep",
        "scope",
        "warning",
        "Scope creep indicators detected",
        `The description chains multiple responsibilities (${conjunctions} scope-creep phrases).`,
        "Keep one issue to one responsibility; open separate issues for unrelated changes.",
      ),
    );
  } else if (conjunctions >= 1) {
    add(
      makeFinding(
        "scope.creep-light",
        "scope",
        "info",
        "Verify the issue has a single responsibility",
        "The description uses connecting phrases that may bundle multiple changes.",
        "Confirm each change is necessary for this single issue, otherwise split it.",
      ),
    );
  }

  const hasSize = hasAny(body, SIZE_INDICATORS);
  if (!hasSize && files.length === 0 && body.trim().length > 600) {
    add(
      makeFinding(
        "scope.no-size-estimate",
        "scope",
        "info",
        "No size estimate",
        "The description does not indicate how large the change is expected to be.",
        'Add a note such as "Estimated ~3 files" or "Completable within a single wave cycle".',
      ),
    );
  }

  const ambiguity = /\beither\b/i.test(haystack) && /\bor\b/i.test(haystack);
  if (ambiguity) {
    add(
      makeFinding(
        "scope.ambiguous-choice",
        "scope",
        "info",
        "Possible either/or ambiguity",
        "The description uses 'either ... or ...', which may leave the approach open-ended.",
        "Pick one approach, or explicitly state that the contributor may choose and must document it.",
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
