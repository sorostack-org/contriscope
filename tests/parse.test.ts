import { describe, expect, it } from "vitest";
import { InputError } from "../src/errors";
import {
  parseIssueFromJson,
  parseIssueFromMarkdown,
  parseIssueInput,
  parseIssuesFromDirectory,
} from "../src/parse";

const markdown = [
  "---",
  "title: Fix the typo",
  'labels: ["bug", "complexity: trivial"]',
  "---",
  "",
  "The README says 'conributor'. Fix the spelling.",
].join("\n");

describe("parse", () => {
  it("parses markdown with frontmatter", () => {
    const issue = parseIssueFromMarkdown(markdown);
    expect(issue.title).toBe("Fix the typo");
    expect(issue.body).toContain("conributor");
    expect(issue.labels).toEqual(["bug", "complexity: trivial"]);
  });

  it("falls back to the first heading as a title", () => {
    const issue = parseIssueFromMarkdown("# Add a helper\n\nBody text here.");
    expect(issue.title).toBe("Add a helper");
    expect(issue.body).toContain("Body text here");
  });

  it("returns an empty title when no title is available", () => {
    const issue = parseIssueFromMarkdown("Just a body without a title.");
    expect(issue.title).toBe("");
  });

  it("parses a JSON issue object", () => {
    const issue = parseIssueFromJson(
      '{"title": "Add X", "body": "Implement X", "labels": ["feature"]}',
    );
    expect(issue.title).toBe("Add X");
    expect(issue.labels).toEqual(["feature"]);
  });

  it("rejects an array as a single issue", () => {
    expect(() => parseIssueFromJson('[{"title": "A"}, {"title": "B"}]')).toThrow(InputError);
  });

  it("detects input format from filename", () => {
    expect(parseIssueInput('{"title": "A", "body": "B"}', "issue.json").format).toBe("json");
    expect(parseIssueInput("# A\n\nB", "issue.md").format).toBe("markdown");
    expect(parseIssueInput('{"title": "A", "body": "B"}').format).toBe("json");
  });

  it("parses a directory JSON file into many issues", () => {
    const issues = parseIssuesFromDirectory(
      '[{"title": "A", "body": "B"}, {"title": "C", "body": "D"}]',
      "all.json",
    );
    expect(issues).toHaveLength(2);
  });

  it("supports a wrapped { issues: [...] } shape", () => {
    const issues = parseIssuesFromDirectory(
      '{"issues": [{"title": "A", "body": "B"}]}',
      "wrapped.json",
    );
    expect(issues).toHaveLength(1);
  });
});
