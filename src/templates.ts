import type { WaveLevel } from "./types";

export type TemplateType = "good-first-issue" | "soroban" | "feature" | "docs" | "bug" | "qa";

export const TEMPLATE_TYPES: readonly TemplateType[] = [
  "good-first-issue",
  "soroban",
  "feature",
  "docs",
  "bug",
  "qa",
];

const COMPLEXITY_LABEL: Record<WaveLevel, string> = {
  trivial: "complexity: trivial",
  medium: "complexity: medium",
  high: "complexity: high",
};

export interface RenderTemplateOptions {
  complexity?: WaveLevel;
  waveLabel?: string;
}

export function renderTemplate(type: TemplateType, options: RenderTemplateOptions = {}): string {
  switch (type) {
    case "good-first-issue":
      return renderGoodFirstIssue(options);
    default:
      return renderGoodFirstIssue(options);
  }
}

function frontmatter(name: string, about: string, titlePrefix: string, labels: string[]): string {
  const labelsJson = JSON.stringify(labels);
  return [
    "---",
    `name: ${name}`,
    `about: ${about}`,
    `title: ${titlePrefix}`,
    `labels: ${labelsJson}`,
    "---",
  ].join("\n");
}

function sharedSections(): string {
  return [
    "## Suggested execution",
    "",
    "- [ ] Fork the repository and create a branch",
    "- [ ] Make the changes in a focused, reviewable commit",
    "- [ ] Add or update tests",
    "- [ ] Run the project's checks (lint, typecheck, tests)",
    "- [ ] Open a pull request and link it with `Closes #<issue-number>`",
    "",
    "## Definition of done",
    "",
    "- [ ] The change behaves as described in the acceptance criteria",
    "- [ ] Tests pass and coverage is maintained",
    "- [ ] Documentation (README/docs) is updated if behaviour changed",
    "- [ ] The pull request is scoped to this issue only",
    "",
  ].join("\n");
}

function renderGoodFirstIssue(options: RenderTemplateOptions): string {
  const labels = ["good first issue", COMPLEXITY_LABEL[options.complexity ?? "trivial"]];
  return [
    frontmatter(
      "Good first issue",
      "A small, well-bounded task for new contributors",
      "[good-first-issue] ",
      labels,
    ),
    "",
    "## Why",
    "",
    "Explain why this work matters and who benefits. Keep it concise — new contributors should grasp the value quickly.",
    "",
    "## What",
    "",
    "Describe the concrete deliverable. Reference the files or modules involved (e.g. `src/checks/scope.ts`).",
    "",
    "## Scope",
    "",
    "This task should be completable within a single sprint. If it is bigger, split it.",
    "",
    "## Acceptance criteria",
    "",
    "- [ ] (specific, observable outcome 1)",
    "- [ ] (specific, observable outcome 2)",
    "- [ ] Tests cover the new behaviour",
    "",
    "## Context for newcomers",
    "",
    "- [ ] Link the relevant docs or code paths",
    "- [ ] Note the network (Testnet vs Mainnet) if Stellar behaviour is involved",
    "- [ ] Point to how to verify the change locally",
    "",
    sharedSections(),
    "",
    "## Complexity",
    "",
    `Suggested complexity: **${(options.complexity ?? "trivial").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
    "",
  ].join("\n");
}

export function renderTemplatesConfig(): string {
  return [
    "# https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file",
    "blank_issues_enabled: true",
    "contact_links:",
    "  - name: GitHub Discussions",
    "    url: https://github.com/Sorostack/contriscope/discussions",
    "    about: Ask questions and discuss ideas",
    "",
  ].join("\n");
}
