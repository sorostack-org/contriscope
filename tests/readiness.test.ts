import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assessRepoReadiness, summarizeReadiness } from "../src/readiness";
import { DEFAULT_CONFIG } from "../src/config";
import { parseIssueFromMarkdown, parseIssuesFromDirectory } from "../src/parse";
import type { RepoMetadata } from "../src/types";

const fixtures = join(__dirname, "fixtures");

function goodRepo(): RepoMetadata {
  return {
    name: "stellar-widget",
    owner: "Sorostack",
    description: "A Stellar widget library",
    hasREADME: true,
    readmeLength: 2000,
    hasContributing: true,
    hasLicense: true,
    hasCodeOfConduct: true,
    hasSecurity: true,
    hasDocs: true,
    hasCi: true,
    hasIssueTemplates: true,
    hasPullRequestTemplates: true,
    openIssues: 10,
    closedIssues: 40,
    stars: 25,
  };
}

function weakRepo(): RepoMetadata {
  return {
    name: "old-repo",
    hasREADME: false,
    hasContributing: false,
    hasLicense: false,
    openIssues: 0,
    closedIssues: 0,
  };
}

describe("assessRepoReadiness", () => {
  it("grades a well-maintained repo highly", () => {
    const content = readFileSync(join(fixtures, "good-issue.md"), "utf8");
    const issues = [parseIssueFromMarkdown(content)];
    const report = assessRepoReadiness(goodRepo(), { config: DEFAULT_CONFIG, issues });
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.grade).toBe("A");
    expect(report.programs.wave.score).toBeGreaterThanOrEqual(60);
    expect(report.programs.grantfox.score).toBeGreaterThanOrEqual(60);
  });

  it("grades a weak repo poorly", () => {
    const report = assessRepoReadiness(weakRepo(), { config: DEFAULT_CONFIG, issues: [] });
    expect(report.score).toBeLessThan(40);
    expect(report.grade).toBe("F");
  });

  it("computes section weights that sum to one", () => {
    const report = assessRepoReadiness(goodRepo(), { config: DEFAULT_CONFIG, issues: [] });
    const sum = report.sections.reduce((total, section) => total + section.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("scores issues from a local JSON fixture", () => {
    const content = readFileSync(join(fixtures, "issues.json"), "utf8");
    const issues = parseIssuesFromDirectory(content, "issues.json");
    expect(issues.length).toBe(2);
    const report = assessRepoReadiness(goodRepo(), { config: DEFAULT_CONFIG, issues });
    expect(report.issuesScored).toBe(2);
    expect(report.issuesTotal).toBe(2);
  });

  it("provides program checklists with explicit met flags", () => {
    const report = assessRepoReadiness(goodRepo(), { config: DEFAULT_CONFIG, issues: [] });
    expect(report.programs.wave.checklist.length).toBeGreaterThan(0);
    expect(report.programs.grantfox.checklist.length).toBeGreaterThan(0);
    expect(report.programs.wave.checklist.every((item) => typeof item.met === "boolean")).toBe(
      true,
    );
  });

  it("produces a readable summary", () => {
    const report = assessRepoReadiness(goodRepo(), { config: DEFAULT_CONFIG, issues: [] });
    const summary = summarizeReadiness(report);
    expect(summary).toContain("stellar-widget");
    expect(summary).toContain("readiness");
  });
});
