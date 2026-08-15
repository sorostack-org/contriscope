import { describe, expect, it } from "vitest";
import { checkClarity } from "../src/checks/clarity";
import { checkScope } from "../src/checks/scope";
import { checkAcceptance } from "../src/checks/acceptance";
import { checkContext } from "../src/checks/context";
import { checkGuidance } from "../src/checks/guidance";
import { checkMetadata } from "../src/checks/metadata";
import { checkStellar, hasStellarContent } from "../src/checks/stellar";
import { DEFAULT_CONFIG } from "../src/config";
import { stripCodeBlocks } from "../src/text";

describe("checkClarity", () => {
  it("scores a well-formed issue at 100", () => {
    const title = "Add SEP-10 authentication flow to the TypeScript client";
    const body = [
      "## Why",
      "Contributors currently implement SEP-10 authentication by hand, which causes frequent errors.",
      "## What",
      "Implement an authenticateWithAnchor helper in src/lib/sep10.ts.",
      "## Acceptance criteria",
      "- [ ] Helper signs the challenge and returns the JWT",
      "- [ ] Unit tests cover the happy path",
    ].join("\n");
    const result = checkClarity({
      config: DEFAULT_CONFIG,
      title,
      body,
      prose: stripCodeBlocks(body),
    });
    expect(result.score).toBe(100);
    expect(result.findings).toHaveLength(0);
  });

  it("flags missing title and thin body", () => {
    const result = checkClarity({
      config: DEFAULT_CONFIG,
      title: "",
      body: "short",
      prose: "short",
    });
    expect(result.score).toBeLessThan(40);
    const ids = result.findings.map((f) => f.id);
    expect(ids).toContain("clarity.title.missing");
    expect(ids).toContain("clarity.body.too-short");
  });

  it("flags vague wording in the title", () => {
    const body = "A longer body with enough content and concrete words to pass length checks.";
    const result = checkClarity({
      config: DEFAULT_CONFIG,
      title: "Improve stuff",
      body,
      prose: body,
    });
    expect(result.findings.some((f) => f.id === "clarity.vague.title")).toBe(true);
  });

  it("flags a placeholder token in the body", () => {
    const body = `A description that is long enough to pass the length checks with an actual placeholder token included.`;
    const result = checkClarity({
      config: DEFAULT_CONFIG,
      title: "Implement the widget",
      body: `${body} Replace the placeholder text.`,
      prose: `${body} Replace the placeholder text.`,
    });
    expect(result.findings.some((f) => f.id === "clarity.placeholder")).toBe(true);
  });
});

describe("checkScope", () => {
  it("scores a scoped issue at 100", () => {
    const body = [
      "## What",
      "Implement `authenticateWithAnchor` in `src/lib/sep10.ts`.",
      "## Acceptance criteria",
      "- [ ] helper returns the JWT",
    ].join("\n");
    const result = checkScope({ config: DEFAULT_CONFIG, title: "Add SEP-10 auth helper", body });
    expect(result.score).toBe(100);
  });

  it("warns when no file references are present", () => {
    const result = checkScope({
      config: DEFAULT_CONFIG,
      title: "Add a feature",
      body: "Add a feature somewhere",
    });
    expect(result.findings.some((f) => f.id === "scope.no-file-reference")).toBe(true);
  });

  it("warns on large-scope phrasing", () => {
    const body = "Rewrite everything in the entire codebase and then add new features.";
    const result = checkScope({ config: DEFAULT_CONFIG, title: "Rewrite everything", body });
    expect(result.findings.some((f) => f.id === "scope.large")).toBe(true);
  });

  it("warns on scope creep conjunctions", () => {
    const body = [
      "Add a form and also validation, in addition to a dashboard, as well as sorting and also filtering.",
    ].join(" ");
    const result = checkScope({ config: DEFAULT_CONFIG, title: "Build the dashboard", body });
    expect(result.findings.some((f) => f.id === "scope.creep")).toBe(true);
  });
});

describe("checkAcceptance", () => {
  it("scores a complete issue at 100", () => {
    const body = [
      "## Acceptance criteria",
      "- [ ] Behaviour is correct",
      "- [ ] Tests cover the change",
      "Closes #42",
    ].join("\n");
    const result = checkAcceptance({ config: DEFAULT_CONFIG, body });
    expect(result.score).toBe(100);
  });

  it("errors when acceptance criteria are missing", () => {
    const result = checkAcceptance({ config: DEFAULT_CONFIG, body: "Just do the thing please." });
    expect(result.findings.some((f) => f.id === "acceptance.criteria-missing")).toBe(true);
    expect(result.findings.some((f) => f.severity === "error")).toBe(true);
  });

  it("warns when criteria lack checkboxes", () => {
    const body = "## Acceptance criteria\nThe thing works correctly.";
    const result = checkAcceptance({ config: DEFAULT_CONFIG, body });
    expect(result.findings.some((f) => f.id === "acceptance.no-checkboxes")).toBe(true);
  });
});

describe("checkContext", () => {
  it("scores a contextual issue at 100", () => {
    const body =
      "Because contributors struggle, this change enables faster onboarding. Link: https://stellar.org/docs";
    const result = checkContext({ title: "Add onboarding docs", body });
    expect(result.score).toBe(100);
  });

  it("warns when no background is given", () => {
    const result = checkContext({ title: "Add X", body: "Add the thing to the module." });
    expect(result.findings.some((f) => f.id === "context.no-background")).toBe(true);
  });
});

describe("checkGuidance", () => {
  it("warns when no files are pointed to", () => {
    const result = checkGuidance({ title: "Do the thing", body: "Implement the behaviour." });
    expect(result.findings.some((f) => f.id === "guidance.no-files")).toBe(true);
  });

  it("scores a guided issue at 100", () => {
    const body = [
      "Edit `src/lib/payments.ts` using TypeScript and @stellar/stellar-sdk.",
      "Verify the change with `npm test` and watch the edge cases.",
    ].join("\n");
    const result = checkGuidance({ title: "Fix payment handling", body });
    expect(result.score).toBe(100);
  });
});

describe("checkMetadata", () => {
  it("warns when no complexity label is present and wave is enabled", () => {
    const result = checkMetadata({ config: DEFAULT_CONFIG, labels: ["bug"] });
    expect(result.findings.some((f) => f.id === "metadata.labels.complexity-missing")).toBe(true);
  });

  it("accepts a complete label set", () => {
    const result = checkMetadata({
      config: DEFAULT_CONFIG,
      labels: ["bug", "complexity: medium", "Stellar Wave", "good first issue"],
    });
    expect(result.score).toBe(100);
  });
});

describe("checkStellar", () => {
  it("is inactive for non-Stellar issues", () => {
    const result = checkStellar({
      config: DEFAULT_CONFIG,
      title: "Fix the button colour",
      body: "CSS only change.",
    });
    expect(result.active).toBe(false);
    expect(hasStellarContent({ title: "Fix the button colour", body: "CSS only change." })).toBe(
      false,
    );
  });

  it("flags missing network context for Stellar content", () => {
    const result = checkStellar({
      config: DEFAULT_CONFIG,
      title: "Send USDC payments",
      body: "Implement a helper that sends XLM and USDC asset payments using the Stellar SDK.",
    });
    expect(result.active).toBe(true);
    expect(result.findings.some((f) => f.id === "stellar.network-missing")).toBe(true);
  });

  it("raises an error when a secret key is embedded", () => {
    const secret = "S" + "X".repeat(55);
    const result = checkStellar({
      config: DEFAULT_CONFIG,
      title: "Debug a transaction",
      body: `The failing transaction uses the secret ${secret} to sign.`,
    });
    expect(
      result.findings.some((f) => f.id === "stellar.secret-key" && f.severity === "error"),
    ).toBe(true);
  });

  it("recognises a valid SEP reference", () => {
    const result = checkStellar({
      config: DEFAULT_CONFIG,
      title: "Implement SEP-10 authentication",
      body: "Follow the SEP-10 specification on the Stellar network.",
    });
    expect(result.findings.some((f) => f.id === "stellar.sep-unknown")).toBe(false);
  });

  it("warns on an unrecognised SEP number", () => {
    const result = checkStellar({
      config: DEFAULT_CONFIG,
      title: "Implement SEP-999",
      body: "Implement the SEP-999 spec on the Stellar network.",
    });
    expect(result.findings.some((f) => f.id === "stellar.sep-unknown")).toBe(true);
  });
});
