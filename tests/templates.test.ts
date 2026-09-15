import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, describe, expect, it } from "vitest";
import {
  renderTemplate,
  renderTemplatesConfig,
  templateTypeFromName,
  TEMPLATE_TYPES,
  writeIssueTemplates,
} from "../src/templates";
import type { WaveLevel } from "../src/types";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "contriscope-template-test-"));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe("TEMPLATE_TYPES", () => {
  it("exposes the six built-in template types", () => {
    expect(TEMPLATE_TYPES).toEqual(["good-first-issue", "soroban", "feature", "docs", "bug", "qa"]);
  });
});

describe("renderTemplate", () => {
  it("renders every template type with frontmatter, complexity, and shared guidance", () => {
    for (const type of TEMPLATE_TYPES) {
      const output = renderTemplate(type);
      expect(output).toContain("---");
      expect(output).toContain("## Complexity");
      if (type === "qa") {
        expect(output).toContain("## Test plan");
      } else {
        expect(output).toContain("## Acceptance criteria");
      }
    }
  });

  it("defaults complexity per type when not provided", () => {
    expect(renderTemplate("good-first-issue")).toContain(
      'labels: ["good first issue","complexity: trivial"]',
    );
    expect(renderTemplate("soroban")).toContain('labels: ["smart contract","complexity: medium"]');
    expect(renderTemplate("bug")).toContain('labels: ["bug","complexity: medium"]');
    expect(renderTemplate("qa")).toContain('labels: ["qa","complexity: trivial"]');
  });

  it("honours an explicit complexity override", () => {
    const output = renderTemplate("feature", { complexity: "high" as WaveLevel });
    expect(output).toContain('labels: ["enhancement","complexity: high"]');
    expect(output).toContain("Suggested complexity: **HIGH**");
  });
});

describe("renderTemplatesConfig", () => {
  it("renders a GitHub-flavoured config with discussions enabled", () => {
    const output = renderTemplatesConfig();
    expect(output).toContain("blank_issues_enabled: true");
    expect(output).toContain("GitHub Discussions");
    expect(output).toContain("sorostack-org/contriscope/discussions");
  });
});

describe("writeIssueTemplates", () => {
  it("writes one file per template plus a config", () => {
    const dir = makeTempDir();
    const written = writeIssueTemplates(dir, {
      complexityByType: { feature: "high" },
    });
    expect(written).toHaveLength(TEMPLATE_TYPES.length + 1);

    for (const type of TEMPLATE_TYPES) {
      const content = readFileSync(join(dir, `${type}.md`), "utf8");
      expect(content).toContain("---");
      expect(content).toContain("## Complexity");
    }
    expect(readFileSync(join(dir, "feature.md"), "utf8")).toContain("complexity: high");
    expect(readFileSync(join(dir, "config.yml"), "utf8")).toContain("blank_issues_enabled");
  });
});

describe("templateTypeFromName", () => {
  it("maps a bare type name", () => {
    expect(templateTypeFromName("soroban")).toBe("soroban");
  });

  it("normalises issue- prefixed and kebab-case names", () => {
    expect(templateTypeFromName("Issue-Bug")).toBe("bug");
    expect(templateTypeFromName("issue-good-first-issue")).toBe("good-first-issue");
  });

  it("returns undefined for unknown names", () => {
    expect(templateTypeFromName("nonsense")).toBeUndefined();
    expect(templateTypeFromName("")).toBeUndefined();
  });
});
