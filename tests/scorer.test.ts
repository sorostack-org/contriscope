import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scoreIssue, computeVerdict, worstFindings } from "../src/scorer";
import { DEFAULT_CONFIG } from "../src/config";
import { parseIssueFromMarkdown } from "../src/parse";
import type { Issue } from "../src/types";

const fixtures = join(__dirname, "fixtures");

describe("scoreIssue", () => {
  it("scores a well-structured issue as ready", () => {
    const content = readFileSync(join(fixtures, "good-issue.md"), "utf8");
    const issue = parseIssueFromMarkdown(content);
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    expect(assessment.score).toBeGreaterThanOrEqual(80);
    expect(assessment.verdict).toBe("ready");
    expect(assessment.dimensions.length).toBeGreaterThanOrEqual(6);
  });

  it("scores a vague issue as needs work", () => {
    const content = readFileSync(join(fixtures, "bad-issue.md"), "utf8");
    const issue = parseIssueFromMarkdown(content);
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    expect(assessment.score).toBeLessThan(80);
    expect(assessment.verdict).not.toBe("ready");
  });

  it("marks an empty issue as blocked", () => {
    const issue: Issue = { title: "", body: "" };
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    expect(assessment.verdict).toBe("blocked");
  });

  it("explains the verdict with a reason", () => {
    const empty = scoreIssue({ title: "", body: "" }, { config: DEFAULT_CONFIG });
    expect(empty.reason).toContain("missing a title or description");

    const good = scoreIssue(
      { title: "Add a helper", body: "Implement a helper with unit tests." },
      { config: DEFAULT_CONFIG },
    );
    expect(good.reason).toContain("meets the ready threshold");
  });

  it("includes a wave suggestion when enabled", () => {
    const issue: Issue = {
      title: "Add SEP-10 authentication",
      body: "Implement the auth helper with tests.",
    };
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    expect(assessment.wave).toBeDefined();
    expect(assessment.wave?.points).toBeGreaterThan(0);
  });

  it("omits the wave suggestion when disabled", () => {
    const issue: Issue = {
      title: "Add SEP-10 authentication",
      body: "Implement the auth helper with tests.",
    };
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG, includeWaveSuggestion: false });
    expect(assessment.wave).toBeUndefined();
  });

  it("respects config overrides", () => {
    const issue: Issue = {
      title: "Add a helper",
      body: "Implement a helper with unit tests. Closes #1.",
    };
    const assessment = scoreIssue(issue, {
      configOverrides: { verdict: { ready: 1, needsWork: 0 } },
    });
    expect(assessment.verdict).toBe("ready");
  });

  it("computes verdicts from score thresholds", () => {
    expect(computeVerdict(90, DEFAULT_CONFIG)).toBe("ready");
    expect(computeVerdict(60, DEFAULT_CONFIG)).toBe("needs-work");
    expect(computeVerdict(10, DEFAULT_CONFIG)).toBe("blocked");
  });

  it("sorts findings by severity", () => {
    const issue: Issue = {
      title: "Improve stuff",
      body: "Clean up the code a bit. Also add some tests. Whatever.",
    };
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    const top = worstFindings(assessment.findings, 3);
    expect(top.length).toBeGreaterThan(0);
    for (let i = 0; i < top.length - 1; i += 1) {
      const rank = { error: 3, warning: 2, info: 1 } as const;
      expect(rank[top[i].severity]).toBeGreaterThanOrEqual(rank[top[i + 1].severity]);
    }
  });

  it("produces a summary", () => {
    const issue: Issue = {
      title: "Add a helper",
      body: "Implement a helper with unit tests. Closes #1.",
    };
    const assessment = scoreIssue(issue, { config: DEFAULT_CONFIG });
    expect(assessment.summary).toContain("scores");
  });
});
