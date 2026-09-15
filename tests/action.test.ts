import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { readActionInputs, runAction } from "../src/action";

const tempDirs: string[] = [];
const savedEnv: Record<string, string | undefined> = {};

function setEnv(entries: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(entries)) {
    savedEnv[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "contriscope-action-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  for (const key of Object.keys(savedEnv)) {
    delete savedEnv[key];
  }
});

afterAll(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe("readActionInputs", () => {
  it("reads simple inputs with defaults", () => {
    setEnv({ GITHUB_REPOSITORY: "sorostack-org/contriscope", INPUT_MODE: "issue" });
    const inputs = readActionInputs();
    expect(inputs.mode).toBe("issue");
    expect(inputs.comment).toBe(false);
    expect(inputs.stellar).toBe(true);
    expect(inputs.wave).toBe(true);
    expect(inputs.grantfox).toBe(true);
    expect(inputs.owner).toBe("sorostack-org");
    expect(inputs.repo).toBe("contriscope");
  });

  it("defaults mode to issue when not given", () => {
    setEnv({ GITHUB_REPOSITORY: "a/b" });
    expect(readActionInputs().mode).toBe("issue");
  });

  it("reads report mode, fail-below, and token", () => {
    setEnv({
      GITHUB_REPOSITORY: "a/b",
      INPUT_MODE: "report",
      INPUT_FAIL_BELOW: "75",
      INPUT_TOKEN: "ghp_xyz",
    });
    const inputs = readActionInputs();
    expect(inputs.mode).toBe("report");
    expect(inputs.failBelow).toBe(75);
    expect(inputs.token).toBe("ghp_xyz");
  });

  it("honours boolean overrides", () => {
    setEnv({
      GITHUB_REPOSITORY: "a/b",
      INPUT_STELLAR: "false",
      INPUT_WAVE: "false",
      INPUT_GRANTFOX: "false",
    });
    const inputs = readActionInputs();
    expect(inputs.stellar).toBe(false);
    expect(inputs.wave).toBe(false);
    expect(inputs.grantfox).toBe(false);
  });

  it("normalises input keys (dashes to underscores)", () => {
    setEnv({ GITHUB_REPOSITORY: "a/b", INPUT_ISSUE_NUMBER: "42" });
    expect(readActionInputs().issueNumber).toBe(42);
  });
});

describe("runAction", () => {
  it("scores an issue from the event payload and writes outputs", async () => {
    const dir = makeTempDir();
    const eventPath = join(dir, "event.json");
    const outputPath = join(dir, "out.txt");
    writeFileSync(
      eventPath,
      JSON.stringify({
        issue: {
          number: 7,
          title: "Add SEP-10 auth helper",
          body: "Implement a typed client using @stellar/stellar-sdk with tests. Network: testnet.",
          labels: [{ name: "enhancement" }, { name: "complexity: medium" }],
        },
      }),
    );
    setEnv({
      GITHUB_REPOSITORY: "sorostack-org/contriscope",
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: outputPath,
      INPUT_MODE: "issue",
    });

    const code = await runAction(readActionInputs());
    expect(code).toBe(0);

    const output = readOutput(outputPath);
    expect(output).toHaveProperty("score");
    expect(output.verdict).toMatch(/ready|needs-work|blocked/);
    expect(output["wave-level"]).toBeDefined();
    expect(output["wave-points"]).toBeDefined();
  });

  it("fails the step when the score is below fail-below", async () => {
    const dir = makeTempDir();
    const eventPath = join(dir, "event.json");
    const outputPath = join(dir, "out.txt");
    writeFileSync(
      eventPath,
      JSON.stringify({
        issue: { number: 1, title: "t", body: "", labels: [] },
      }),
    );
    setEnv({
      GITHUB_REPOSITORY: "sorostack-org/contriscope",
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: outputPath,
      INPUT_MODE: "issue",
      INPUT_FAIL_BELOW: "99",
    });

    const code = await runAction(readActionInputs());
    expect(code).toBe(1);
  });

  it("returns 0 when no issue number is present", async () => {
    setEnv({
      GITHUB_REPOSITORY: "sorostack-org/contriscope",
      INPUT_MODE: "issue",
    });
    const code = await runAction(readActionInputs());
    expect(code).toBe(0);
  });
});

function readOutput(path: string): Record<string, string> {
  const contents = readFileSync(path, "utf8");
  const result: Record<string, string> = {};
  for (const line of contents.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      result[line.slice(0, eq)] = line.slice(eq + 1);
    }
  }
  return result;
}
