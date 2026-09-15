import { describe, expect, it, vi } from "vitest";
import { run } from "../src/cli";

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const live = token !== undefined && token.length > 0;

describe.runIf(live)("check-repo end-to-end", () => {
  it("produces a readiness report for a real repository", async () => {
    let output = "";
    const original = process.stdout.write.bind(process.stdout);
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      output += String(chunk);
      return true;
    });
    try {
      const code = await run(["check-repo", "--slug", "sorostack-org/contriscope"]);
      expect(code).toBe(0);
    } finally {
      (process.stdout.write as unknown as { mockRestore: () => void }).mockRestore();
    }
    expect(output).toContain("readiness");
    expect(output).toContain("/100");
  });
});
