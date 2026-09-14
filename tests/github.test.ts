import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllOpenIssues,
  fetchIssue,
  fetchIssues,
  fetchRepoFile,
  fetchRepoFiles,
  githubRequest,
  parseRepositorySlug,
} from "../src/github";
import { GitHubError } from "../src/errors";

function mockFetchResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Map(Object.entries(headers)) as unknown as Headers,
        json: async () => body,
      } as unknown as Response;
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("github adapter", () => {
  it("fetches issues and maps them", async () => {
    mockFetchResponse(200, [
      {
        number: 7,
        title: "Add SEP-10 auth",
        body: "Implement the helper.",
        html_url: "https://github.com/sorostack-org/contriscope/issues/7",
        state: "open",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        comments: 2,
        labels: [{ name: "enhancement" }],
      },
    ]);
    const issues = await fetchIssues("sorostack-org", "contriscope", { token: "test" });
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe("Add SEP-10 auth");
    expect(issues[0].labels).toEqual(["enhancement"]);
    expect(issues[0].number).toBe(7);
  });

  it("excludes pull requests by default", async () => {
    mockFetchResponse(200, [
      { number: 1, title: "A", body: "b", pull_request: {} },
      { number: 2, title: "B", body: "b" },
    ]);
    const issues = await fetchIssues("o", "r");
    expect(issues).toHaveLength(1);
    expect(issues[0].number).toBe(2);
  });

  it("maps a single issue", async () => {
    mockFetchResponse(200, {
      number: 3,
      title: "Fix docs",
      body: "Update the README.",
      html_url: "https://github.com/sorostack-org/contriscope/issues/3",
      state: "open",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      comments: 0,
      labels: [],
    });
    const issue = await fetchIssue("sorostack-org", "contriscope", 3, { token: "x" });
    expect(issue.number).toBe(3);
  });

  it("throws a friendly error on rate limiting", async () => {
    mockFetchResponse(
      403,
      { message: "API rate limit exceeded" },
      { "x-ratelimit-remaining": "0" },
    );
    await expect(githubRequest("/repos/o/r")).rejects.toMatchObject({ rateLimited: true });
  });

  it("throws on a 404 with the API message", async () => {
    mockFetchResponse(404, { message: "Not Found" });
    await expect(githubRequest("/repos/o/r")).rejects.toThrow(GitHubError);
  });

  it("fetches repo root files", async () => {
    mockFetchResponse(200, [{ name: "README.md" }, { name: "src" }]);
    const files = await fetchRepoFiles("o", "r");
    expect(files).toContain("README.md");
  });

  it("fetches a file from a subdirectory", async () => {
    mockFetchResponse(200, [{ name: "ci.yml" }]);
    const files = await fetchRepoFiles("o", "r", ".github/workflows");
    expect(files).toContain("ci.yml");
  });

  it("decodes a base64 repo file", async () => {
    const encoded = Buffer.from("# README\n".repeat(10), "utf8").toString("base64");
    mockFetchResponse(200, { content: encoded, encoding: "base64" });
    const content = await fetchRepoFile("o", "r", "README.md");
    expect(content).toContain("# README");
  });

  it("returns undefined for a missing repo file", async () => {
    mockFetchResponse(404, { message: "Not Found" });
    const content = await fetchRepoFile("o", "r", "nope.md");
    expect(content).toBeUndefined();
  });

  it("paginates until fewer than 100 issues are returned", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      number: i + 1,
      title: `Issue ${i + 1}`,
      body: "body",
      state: "open",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      comments: 0,
      labels: [],
    }));
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => page1,
    } as unknown as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchAllOpenIssues("o", "r");
    expect(issues).toHaveLength(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("paginates until fewer than 100 issues are returned", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      number: i + 1,
      title: `Issue ${i + 1}`,
      body: "body",
      state: "open",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      comments: 0,
      labels: [],
    }));
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => page1,
    } as unknown as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchAllOpenIssues("o", "r");
    expect(issues).toHaveLength(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fetches the next page when a full page is all pull requests", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      number: i + 1,
      title: `PR ${i + 1}`,
      body: "body",
      state: "open",
      pull_request: {},
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      comments: 0,
      labels: [],
    }));
    const issue = {
      number: 101,
      title: "First real issue",
      body: "body",
      state: "open",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      comments: 0,
      labels: [],
    };
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => page1,
    } as unknown as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => [issue],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchAllOpenIssues("o", "r");
    expect(issues).toHaveLength(1);
    expect(issues[0].number).toBe(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("parses repository slugs", () => {
    expect(parseRepositorySlug("sorostack-org/contriscope")).toEqual({
      owner: "sorostack-org",
      repo: "contriscope",
    });
    expect(parseRepositorySlug("https://github.com/sorostack-org/contriscope")).toEqual({
      owner: "sorostack-org",
      repo: "contriscope",
    });
    expect(() => parseRepositorySlug("invalid")).toThrow(GitHubError);
  });
});
