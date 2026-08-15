import { extractIssueReferences, extractUrls, hasAny } from "../text";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

const BACKGROUND_MARKERS = [
  "because",
  "currently",
  "problem",
  "motivation",
  "goal",
  "background",
  "context",
  "why",
  "this is needed",
  "benefit",
  "the issue",
  "today",
  "purpose",
];

const IMPACT_MARKERS = [
  "users",
  "developers",
  "customers",
  "community",
  "reduces",
  "improves",
  "enables",
  "unblocks",
  "impact",
  "benefit",
  "saves",
];

export interface ContextInput {
  title: string;
  body: string;
}

export function checkContext(input: ContextInput): { score: number; findings: Finding[] } {
  const { title, body } = input;
  const findings: Finding[] = [];
  const haystack = `${title} ${body}`;
  let penalty = 0;

  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  if (!hasAny(haystack, BACKGROUND_MARKERS)) {
    add(
      makeFinding(
        "context.no-background",
        "context",
        "warning",
        "No background or motivation",
        "The issue does not explain why the work matters, which makes it harder to prioritise and review.",
        "Add a short 'Why' or 'Background' paragraph: what is the problem and who is affected.",
      ),
    );
  }

  const urls = extractUrls(haystack);
  const refs = extractIssueReferences(haystack);
  if (urls.length === 0 && refs.length === 0) {
    add(
      makeFinding(
        "context.no-links",
        "context",
        "info",
        "No links or references",
        "The issue contains no links to related issues, docs, designs, or discussions.",
        "Link to related issues (#123), the relevant docs, or a design reference.",
      ),
    );
  }

  if (!hasAny(haystack, IMPACT_MARKERS)) {
    add(
      makeFinding(
        "context.no-impact",
        "context",
        "info",
        "Impact not described",
        "The issue does not describe who benefits or what improves.",
        'Mention the outcome, e.g. "This unblocks contributors who need SEP-24 withdrawals".',
      ),
    );
  }

  return { score: clampScore(100 - penalty), findings };
}
