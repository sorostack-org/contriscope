import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, describe, expect, it, vi } from "vitest";
import { parseArgs, run } from "../src/cli";

const fixtures = join(__dirname, "fixtures");
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "contriscope-test-"));
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

async function capture(
  operation: () => Promise<number>,
): Promise<{ code: number; output: string }> {
  let output = "";
  const original = process.stdout.write.bind(process.stdout);
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    output += String(chunk);
    return true;
  });
  try {
    const code = await operation();
    return { code, output };
  } finally {
    (process.stdout.write as unknown as { mockRestore: () => void }).mockRestore();
    void original;
  }
}

describe("parseArgs", () => {
  it("parses commands, positionals, and options", () => {
    const parsed = parseArgs(["check", "file.md", "--format", "json", "--fail-below=70"]);
    expect(parsed.command).toBe("check");
    expect(parsed.positional).toEqual(["file.md"]);
    expect(parsed.options.format).toBe("json");
    expect(parsed.options["fail-below"]).toBe("70");
  });

  it("treats flags without values as booleans", () => {
    const parsed = parseArgs(["check", "x.md", "--no-stellar"]);
    expect(parsed.options["no-stellar"]).toBe(true);
  });
});

describe("run: help and version", () => {
  it("prints help and exits 0", async () => {
    const { code, output } = await capture(() => run(["help"]));
    expect(code).toBe(0);
    expect(output).toContain("ContriScope");
  });

  it("prints the version and exits 0", async () => {
    const { code, output } = await capture(() => run(["version"]));
    expect(code).toBe(0);
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
});

describe("run: check", () => {
  it("scores a good issue and exits 0", async () => {
    const { code, output } = await capture(() => run(["check", join(fixtures, "good-issue.md")]));
    expect(code).toBe(0);
    expect(output).toContain("ContriScope report");
  });

  it("scores an issue as JSON", async () => {
    const { code, output } = await capture(() =>
      run(["check", join(fixtures, "good-issue.md"), "--format", "json"]),
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(output) as { score: number };
    expect(parsed.score).toBeGreaterThanOrEqual(80);
  });

  it("fails when --fail-below is set above the score", async () => {
    const { code } = await capture(() =>
      run(["check", join(fixtures, "bad-issue.md"), "--fail-below", "80"]),
    );
    expect(code).toBe(1);
  });

  it("reads an issue from stdin", async () => {
    const originalStdin = process.stdin;
    const fake = Object.assign(new EventEmitter(), {
      isTTY: false,
      read: () => undefined,
      setEncoding: () => undefined,
      pause: () => fake,
      resume: () => fake,
    }) as unknown as NodeJS.ReadStream;
    Object.defineProperty(process, "stdin", { value: fake, configurable: true });

    const { code } = await capture(() => {
      setImmediate(() => {
        fake.emit(
          "data",
          Buffer.from(JSON.stringify({ title: "Add a helper", body: "Implement it with tests." })),
        );
        fake.emit("end");
      });
      return run(["check", "-"]);
    });

    expect(code).toBe(0);
    Object.defineProperty(process, "stdin", { value: originalStdin, configurable: true });
  });

  it("returns exit code 2 for a missing file", async () => {
    const { code } = await capture(() => run(["check", join(fixtures, "does-not-exist.md")]));
    expect(code).toBe(2);
  });

  it("returns exit code 2 for an unknown command", async () => {
    const { code } = await capture(() => run(["frobnicate"]));
    expect(code).toBe(2);
  });
});

describe("run: check-repo", () => {
  it("analyses a local directory of issues", async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, "README.md"), "x".repeat(500), "utf8");
    writeFileSync(join(dir, "CONTRIBUTING.md"), "How to contribute", "utf8");
    writeFileSync(
      join(dir, "issue-1.md"),
      "# Add SEP-10 auth\n\nBody with acceptance criteria.\n\n## Acceptance criteria\n- [ ] done",
      "utf8",
    );
    const { code, output } = await capture(() => run(["check-repo", "--path", dir]));
    expect(code).toBe(0);
    expect(output).toContain("Repository readiness");
  });

  it("requires --slug or --owner/--repo when no --path is given", async () => {
    const { code } = await capture(() => run(["check-repo"]));
    expect(code).toBe(2);
  });
});

describe("run: template", () => {
  it("prints the soroban template", async () => {
    const { code, output } = await capture(() => run(["template", "soroban"]));
    expect(code).toBe(0);
    expect(output).toContain("Soroban contract task");
    expect(output).toContain("Acceptance criteria");
  });

  it("writes templates to disk with --write", async () => {
    const dir = makeTempDir();
    const { code, output } = await capture(() =>
      run(["template", "all", "--write", "--dir", join(dir, ".github", "ISSUE_TEMPLATE")]),
    );
    expect(code).toBe(0);
    expect(output).toContain("Wrote");
    const writtenDir = join(dir, ".github", "ISSUE_TEMPLATE");
    expect(existsSync(writtenDir)).toBe(true);
    expect(readdirSync(writtenDir).some((name) => name === "soroban.md")).toBe(true);
  });

  it("rejects an unknown template type", async () => {
    const { code } = await capture(() => run(["template", "nonsense"]));
    expect(code).toBe(2);
  });
});

describe("run: init", () => {
  it("scaffolds config and templates", async () => {
    const dir = makeTempDir();
    const { code, output } = await capture(() => run(["init", "--dir", dir]));
    expect(code).toBe(0);
    expect(output).toContain("Initialised ContriScope");
    expect(existsSync(join(dir, ".contriscope.json"))).toBe(true);
    expect(existsSync(join(dir, ".github", "ISSUE_TEMPLATE", "feature.md"))).toBe(true);
  });
});

describe("run: config", () => {
  it("prints the effective configuration as JSON", async () => {
    const { code, output } = await capture(() => run(["config"]));
    expect(code).toBe(0);
    const parsed = JSON.parse(output) as { verdict: { ready: number } };
    expect(parsed.verdict.ready).toBe(80);
  });
});
