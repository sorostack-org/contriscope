import { describe, expect, it } from "vitest";
import { renderIssueAssessment, renderRepoReadiness, renderWaveSuggestion } from "../src/report";
import { scoreIssue } from "../src/scorer";
import { assessRepoReadiness } from "../src/readiness";
import { DEFAULT_CONFIG } from "../src/config";
import type { Issue, RepoMetadata } from "../src/types";

const issue: Issue = {
  title: "Add SEP-10 authentication helper",
  body: [
    "## Why",
    "Because contributors need a standard flow.",
    "## Acceptance criteria",
    "- [ ] helper returns the JWT",
    "- [ ] tests cover the flow",
    "Closes #42",
  ].join("\n"),
};

describe("report formatting", () => {
  it("renders JSON", () => {
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    const output = renderIssueAssessment(assessment, "json");
    const parsed = JSON.parse(output) as { score: number; verdict: string };
    expect(parsed.score).toBeGreaterThanOrEqual(0);
    expect(typeof parsed.verdict).toBe("string");
  });

  it("renders markdown with score and verdict", () => {
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    const output = renderIssueAssessment(assessment, "markdown");
    expect(output).toContain("ContriScope report");
    expect(output).toContain("Score:");
    expect(output).toContain("Dimension scores");
  });

  it("renders plain text", () => {
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    const output = renderIssueAssessment(assessment, "text", { colors: false });
    expect(output).toContain("ContriScope report");
    expect(output).not.toContain("\x1b");
  });

  it("renders the wave suggestion", () => {
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    const wave = assessment.wave;
    expect(wave).toBeDefined();
    expect(renderWaveSuggestion(wave!)).toContain("points");
  });

  it("renders a readiness report as markdown", () => {
    const repo: RepoMetadata = {
      name: "stellar-widget",
      hasREADME: true,
      readmeLength: 1000,
      hasContributing: true,
      hasLicense: true,
      hasCodeOfConduct: true,
      hasSecurity: true,
      hasDocs: true,
      hasCi: true,
      hasIssueTemplates: true,
      hasPullRequestTemplates: true,
      openIssues: 5,
      closedIssues: 20,
    };
    const report = assessRepoReadiness(repo, { config: DEFAULT_CONFIG, issues: [issue] });
    const output = renderRepoReadiness(report, "markdown");
    expect(output).toContain("Repository readiness: stellar-widget");
    expect(output).toContain("Drips Wave");
    expect(output).toContain("GrantFox");
  });

  it("renders a readiness report as JSON that round-trips", () => {
    const repo: RepoMetadata = { name: "stellar-widget" };
    const report = assessRepoReadiness(repo, { config: DEFAULT_CONFIG, issues: [] });
    const output = renderRepoReadiness(report, "json");
    const parsed = JSON.parse(output) as { score: number; grade: string };
    expect(typeof parsed.score).toBe("number");
    expect(["A", "B", "C", "D", "F"]).toContain(parsed.grade);
  });
});
