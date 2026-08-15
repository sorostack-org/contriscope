import { containsCheckboxes, extractFileReferences, hasAny, hasSection } from "../text";
import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

export const ACCEPTANCE_HEADINGS = [
  "acceptance criteria",
  "acceptance cri",
  "definition of done",
  "done when",
  "what done looks like",
  "done criteria",
  "requirements and context",
  "checklist",
];

const TEST_TERMS = ["test", "coverage", "verify", "validated", "spec"];

export interface AcceptanceInput {
  config: ContriscopeConfig;
  body: string;
}

export function checkAcceptance(input: AcceptanceInput): { score: number; findings: Finding[] } {
  const { body } = input;
  const findings: Finding[] = [];
  let penalty = 0;

  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  const hasAcceptance = hasSection(body, ACCEPTANCE_HEADINGS);
  if (!hasAcceptance) {
    add(
      makeFinding(
        "acceptance.criteria-missing",
        "acceptance",
        "error",
        "No acceptance criteria",
        "The issue does not define what 'done' means. Contributors cannot know when their PR is complete.",
        "Add an 'Acceptance criteria' section with concrete, verifiable outcomes.",
      ),
    );
  } else {
    if (!containsCheckboxes(body)) {
      add(
        makeFinding(
          "acceptance.no-checkboxes",
          "acceptance",
          "warning",
          "Acceptance criteria without checkboxes",
          "The issue mentions acceptance criteria but does not use a checkbox list.",
          "Use a `- [ ]` checklist so both contributors and reviewers can track completion.",
        ),
      );
    }
  }

  const files = extractFileReferences(body);
  const looksCodeHeavy = files.length > 0;
  const hasTestMention = hasAny(body, TEST_TERMS);
  if (!hasTestMention) {
    add(
      makeFinding(
        "acceptance.no-tests",
        "acceptance",
        looksCodeHeavy ? "warning" : "info",
        "Testing expectations not stated",
        "The issue does not mention how the change should be tested or verified.",
        "State the expected verification, e.g. 'Add unit tests and ensure `npm test` passes'.",
      ),
    );
  }

  const closesReference = /closes\s+#\d+/i.test(body) || /fixes\s+#\d+/i.test(body);
  if (!closesReference) {
    add(
      makeFinding(
        "acceptance.no-close-reference",
        "acceptance",
        "info",
        "PR-to-issue linkage not specified",
        "Funded programs require the pull request to reference the issue it resolves.",
        "Tell contributors to include `Closes #<issue-number>` in the PR description.",
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
