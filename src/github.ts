import { GitHubError } from "./errors";
import type { Issue, RepoMetadata } from "./types";

const API_BASE = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 250;
const MAX_RETRY_WAIT_MS = 10_000;
const MAX_PAGES_DEFAULT = 50;

export interface GitHubCredentials {
  token?: string;
}

export interface FetchIssuesOptions {
  state?: "open" | "closed" | "all";
  perPage?: number;
  page?: number;
  excludePullRequests?: boolean;
  maxPages?: number;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  retryBaseMs?: number;
}

interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  comments: number;
  labels?: { name: string }[];
  pull_request?: unknown;
}

interface GitHubRepoResponse {
  full_name: string;
  description: string | null;
  default_branch: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  homepage: string | null;
  language: string | null;
}

interface LinkHeaderResult {
  next?: string;
  last?: string;
  prev?: string;
  first?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

export function parseLinkHeader(header: string | null | undefined): LinkHeaderResult {
  const result: LinkHeaderResult = {};
  if (!header) {
    return result;
  }
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const rel = match[2];
      if (rel === "next" || rel === "last" || rel === "prev" || rel === "first") {
        result[rel] = match[1];
      }
    }
  }
  return result;
}

async function githubFetch(
  path: string,
  credentials: GitHubCredentials = {},
  options: RequestOptions = {},
): Promise<Response> {
  const maxRetries = options.retries ?? DEFAULT_MAX_RETRIES;
  const retryBaseMs = options.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", "contriscope");
  if (credentials.token) {
    headers.set("Authorization", `Bearer ${credentials.token}`);
  }

  let lastStatus = 0;
  let rateLimited = false;
  let retryAfterSeconds: number | undefined;

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new GitHubError(`Network error while reaching the GitHub API: ${detail}`);
    }

    if (response.ok) {
      return response;
    }

    const remaining = response.headers.get("x-ratelimit-remaining");
    lastStatus = response.status;
    rateLimited = response.status === 403 && remaining === "0";
    retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"));

    const isSecondaryLimit =
      (response.status === 403 || response.status === 429) && remaining !== "0";
    const isTransientServerError =
      response.status === 502 || response.status === 503 || response.status === 504;
    const retryable =
      !rateLimited && (isSecondaryLimit || isTransientServerError) && attempt < maxRetries;

    if (retryable) {
      const delayMs =
        retryAfterSeconds !== undefined
          ? Math.min(retryAfterSeconds * 1000, MAX_RETRY_WAIT_MS)
          : retryBaseMs * 2 ** attempt;
      await sleep(delayMs);
      continue;
    }

    let message = `GitHub API request failed with status ${response.status} for ${path}.`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // ignore body parse errors
    }
    throw new GitHubError(message, { status: response.status, rateLimited, retryAfterSeconds });
  }
}

export async function githubRequest<T>(
  path: string,
  credentials: GitHubCredentials = {},
): Promise<T> {
  const response = await githubFetch(path, credentials);
  return (await response.json()) as T;
}

export async function fetchIssue(
  owner: string,
  repo: string,
  number: number,
  credentials: GitHubCredentials = {},
): Promise<Issue> {
  const payload = await githubRequest<GitHubIssueResponse>(
    `/repos/${owner}/${repo}/issues/${number}`,
    credentials,
  );
  return mapGitHubIssue(payload);
}

export async function fetchIssues(
  owner: string,
  repo: string,
  credentials: GitHubCredentials = {},
  options: FetchIssuesOptions = {},
): Promise<Issue[]> {
  const { state = "open", perPage = 100, page = 1, excludePullRequests = true } = options;
  const query = new URLSearchParams({ state, per_page: String(perPage), page: String(page) });
  const payload = await githubRequest<GitHubIssueResponse[]>(
    `/repos/${owner}/${repo}/issues?${query.toString()}`,
    credentials,
  );
  return payload
    .filter((issue) => !excludePullRequests || issue.pull_request === undefined)
    .map(mapGitHubIssue);
}

export async function fetchAllOpenIssues(
  owner: string,
  repo: string,
  credentials: GitHubCredentials = {},
  options: FetchIssuesOptions = {},
): Promise<Issue[]> {
  const { perPage = 100, excludePullRequests = true, maxPages = MAX_PAGES_DEFAULT } = options;
  const issues: Issue[] = [];
  let page = 1;
  for (;;) {
    if (page > maxPages) {
      throw new GitHubError(
        `Pagination exceeded ${maxPages} pages for ${owner}/${repo}; aborting to avoid an unbounded loop.`,
      );
    }
    const response = await githubFetch(
      `/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}&page=${page}`,
      credentials,
    );
    const raw = (await response.json()) as GitHubIssueResponse[];
    const filtered = raw
      .filter((issue) => !excludePullRequests || issue.pull_request === undefined)
      .map(mapGitHubIssue);
    issues.push(...filtered);
    const link = parseLinkHeader(response.headers.get("link"));
    if (link.next) {
      page += 1;
      continue;
    }
    if (raw.length < perPage) {
      break;
    }
    page += 1;
  }
  return issues;
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string,
  credentials: GitHubCredentials = {},
): Promise<RepoMetadata> {
  const payload = await githubRequest<GitHubRepoResponse>(`/repos/${owner}/${repo}`, credentials);
  return {
    name: repo,
    owner,
    description: payload.description ?? undefined,
    defaultBranch: payload.default_branch,
    openIssues: payload.open_issues_count,
    stars: payload.stargazers_count,
    forks: payload.forks_count,
    homepage: payload.homepage ?? undefined,
    primaryLanguage: payload.language ?? undefined,
  };
}

export async function postComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
  credentials: GitHubCredentials = {},
): Promise<void> {
  await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, credentials, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
    retries: 0,
  });
}

export async function fetchRepoFileExistence(
  owner: string,
  repo: string,
  path: string,
  credentials: GitHubCredentials = {},
): Promise<boolean> {
  try {
    await githubRequest(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      credentials,
    );
    return true;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
  credentials: GitHubCredentials = {},
): Promise<string | undefined> {
  try {
    const payload = await githubRequest<{ content?: string; encoding?: string }>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      credentials,
    );
    if (payload.content && payload.encoding === "base64") {
      return Buffer.from(payload.content, "base64").toString("utf8");
    }
    return undefined;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

export async function fetchRepoFiles(
  owner: string,
  repo: string,
  path = "",
  credentials: GitHubCredentials = {},
): Promise<string[]> {
  const payload = await githubRequest<{ name: string }[]>(
    `/repos/${owner}/${repo}/contents${path ? `/${encodeURIComponent(path)}` : ""}`,
    credentials,
  );
  return payload.map((entry) => entry.name);
}

export function mapGitHubIssue(issue: GitHubIssueResponse): Issue {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    labels: (issue.labels ?? []).map((label) => label.name),
    url: issue.html_url,
    state: issue.state,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    comments: issue.comments,
  };
}

export function mapGitHubRepo(repo: GitHubRepoResponse): RepoMetadata {
  return {
    name: repo.full_name.split("/")[1] ?? repo.full_name,
    owner: repo.full_name.split("/")[0],
    description: repo.description ?? undefined,
    defaultBranch: repo.default_branch,
    openIssues: repo.open_issues_count,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    homepage: repo.homepage ?? undefined,
    primaryLanguage: repo.language ?? undefined,
  };
}

export function parseRepositorySlug(slug: string): { owner: string; repo: string } {
  const match = slug.match(/^(?:https?:\/\/)?(?:github\.com\/)?([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
  if (!match) {
    throw new GitHubError(`Invalid repository slug "${slug}". Expected "owner/repo".`);
  }
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}
