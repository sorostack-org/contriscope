import { countOccurrences, countWords, hasAny } from "../text";
import type { ContriscopeConfig } from "../config";
import type { Issue, Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

const ACTIONABLE_VERBS = [
  "implement",
  "add",
  "create",
  "fix",
  "refactor",
  "build",
  "support",
  "remove",
  "extend",
  "document",
  "write",
  "update",
  "upgrade",
  "migrate",
  "integrate",
  "replace",
  "introduce",
  "enable",
  "adjust",
  "handle",
  "expose",
  "wire up",
  "make",
  "use",
];

export interface ClarityInput {
  config: ContriscopeConfig;
  title: string;
  body: string;
  prose: string;
}

export function checkClarity(input: ClarityInput): { score: number; findings: Finding[] } {
  const { config, title, body, prose } = input;
  const findings: Finding[] = [];
  let penalty = 0;

  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  if (!title.trim()) {
    add(
      makeFinding(
        "clarity.title.missing",
        "clarity",
        "error",
        "Title is missing",
        "The issue has no title. Contributors should be able to understand the task from the title alone.",
        'Use a short, imperative title such as "Add SEP-10 authentication flow".',
      ),
    );
  } else {
    if (title.trim().length < config.title.min) {
      add(
        makeFinding(
          "clarity.title.too-short",
          "clarity",
          "error",
          "Title is too short",
          `The title is ${title.trim().length} characters; at least ${config.title.min} is recommended.`,
          "Be more specific, e.g. 'Fix fee estimation for batch payments' instead of 'Fix fees'.",
        ),
      );
    }
    if (title.trim().length > config.title.max) {
      add(
        makeFinding(
          "clarity.title.too-long",
          "clarity",
          "warning",
          "Title is long",
          `The title is ${title.trim().length} characters; aim for ${config.title.max} or fewer.`,
          "Move detail into the description and keep the title scannable.",
        ),
      );
    }
    if (/\?\s*$/.test(title.trim())) {
      add(
        makeFinding(
          "clarity.title.question",
          "clarity",
          "info",
          "Title reads as a question",
          "Titles phrased as questions are less actionable for contributors.",
          'Prefer an imperative form: "Add a claim and burn UI" over "Can we add a claim UI?".',
        ),
      );
    }
  }

  if (!body.trim()) {
    add(
      makeFinding(
        "clarity.body.missing",
        "clarity",
        "error",
        "Description is missing",
        "The issue has no description. Without context, contributors cannot estimate scope or acceptance criteria.",
        "Describe the task, why it matters, and what 'done' looks like.",
      ),
    );
  } else {
    if (body.trim().length < config.minDescriptionLength) {
      add(
        makeFinding(
          "clarity.body.too-short",
          "clarity",
          "error",
          "Description is too short",
          `The description is ${body.trim().length} characters; at least ${config.minDescriptionLength} is recommended.`,
          "Add background, requirements, and acceptance criteria so contributors can work without asking.",
        ),
      );
    }
    if (countWords(prose) < config.minBodyWords) {
      add(
        makeFinding(
          "clarity.body.low-word-count",
          "clarity",
          "warning",
          "Description is thin",
          `The prose body has ${countWords(prose)} words; contributors need enough context to scope the work.`,
          "Expand the description with context, examples, and a definition of done.",
        ),
      );
    }
  }

  const titleVague = config.vagueTerms.filter((term) => title.toLowerCase().includes(term));
  const bodyVague = config.vagueTerms.filter((term) => body.toLowerCase().includes(term));
  for (const term of titleVague.slice(0, 2)) {
    add(
      makeFinding(
        "clarity.vague.title",
        "clarity",
        "error",
        `Vague wording in title: "${term}"`,
        `The title contains "${term}", which does not describe a concrete deliverable.`,
        "Name the specific behaviour or artifact the issue should produce.",
      ),
    );
  }
  for (const term of bodyVague.slice(0, 3)) {
    add(
      makeFinding(
        "clarity.vague.body",
        "clarity",
        "warning",
        `Vague wording in description: "${term}"`,
        `The description uses "${term}" without defining the expected outcome.`,
        "Replace it with a concrete, testable statement.",
      ),
    );
  }

  for (const token of config.placeholderTokens.slice(0, 2)) {
    if (body.toLowerCase().includes(token)) {
      add(
        makeFinding(
          "clarity.placeholder",
          "clarity",
          "warning",
          `Possible placeholder token: "${token}"`,
          `The description contains "${token}", which may indicate unfinished content.`,
          "Replace placeholders with real requirements before publishing the issue.",
        ),
      );
    }
  }

  const hasVerb = hasAny(`${title} ${body}`, ACTIONABLE_VERBS);
  if (!hasVerb) {
    add(
      makeFinding(
        "clarity.actionable-verb",
        "clarity",
        "warning",
        "No actionable verb found",
        "The issue does not describe a concrete action (implement, add, fix, refactor...).",
        "Start the title with an imperative verb so contributors know what to do.",
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
