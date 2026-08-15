import { describe, expect, it } from "vitest";
import {
  containsCheckboxes,
  countWords,
  extractCodeBlocks,
  extractFileReferences,
  extractUrls,
  hasAny,
  hasSection,
} from "../src/text";

describe("text utilities", () => {
  it("counts words", () => {
    expect(countWords("Fix the typo in the README")).toBe(6);
    expect(countWords("")).toBe(0);
  });

  it("detects words case-insensitively with word boundaries", () => {
    expect(hasAny("Fix the broken link now", ["broken link", "typo"])).toBe(true);
    expect(hasAny("Fix the broken-link now", ["broken link"])).toBe(false);
  });

  it("extracts code blocks and strips them from prose", () => {
    const value = "Some prose\n```ts\nconst x = 1;\n```\nmore prose";
    expect(extractCodeBlocks(value)).toHaveLength(1);
    const stripped = value.replace(/```[\s\S]*?```/g, " ");
    expect(stripped).not.toContain("const x");
  });

  it("extracts urls", () => {
    expect(extractUrls("See https://github.com/stellar/example, and https://stellar.org.")).toEqual(
      ["https://github.com/stellar/example", "https://stellar.org"],
    );
  });

  it("detects acceptance sections", () => {
    expect(hasSection("## Acceptance criteria\n- [ ] done", ["acceptance criteria"])).toBe(true);
    expect(hasSection("Just some body text", ["acceptance criteria"])).toBe(false);
  });

  it("detects checkboxes", () => {
    expect(containsCheckboxes("- [ ] a\n- [x] b")).toBe(true);
    expect(containsCheckboxes("plain text")).toBe(false);
  });

  it("extracts file references", () => {
    expect(extractFileReferences("Edit `src/lib/sep10.ts` and src/checks/scope.ts")).toContain(
      "src/lib/sep10.ts",
    );
  });
});
