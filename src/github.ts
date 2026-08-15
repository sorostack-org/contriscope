import { GitHubError } from "./errors";
import type { Issue, RepoMetadata } from "./types";

const API_BASE = "https://api.github.com";

export interface GitHubCredentials {
  token?: string;
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

export async function githubRequest<T>(
  path: string,
  credentials: GitHubCredentials = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "contriscope",
  };
  if (credentials.token) {
    headers.Authorization = `Bearer ${credentials.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new GitHubError(`Network error while reaching the GitHub API: ${detail}`);
  }

  if (!response.ok) {
    const rateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
    let message = `GitHub API request failed with status ${response.status} for ${path}.`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // ignore body parse errors
    }
    throw new GitHubError(message, { status: response.status, rateLimited });
  }

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

export interface FetchIssuesOptions {
  state?: "open" | "closed" | "all";
  perPage?: number;
  page?: number;
  excludePullRequests?: boolean;
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
    hasREADME: true,
    hasContributing: true,
    hasDocs: true,
    hasCi: true,
  };
}

export async function fetchAllOpenIssues(
  owner: string,
  repo: string,
  credentials: GitHubCredentials = {},
): Promise<Issue[]> {
  const issues: Issue[] = [];
  let page = 1;
  for (;;) {
    const batch = await fetchIssues(owner, repo, credentials, {
      state: "open",
      perPage: 100,
      page,
    });
    issues.push(...batch);
    if (batch.length < 100) {
      break;
    }
    page += 1;
  }
  return issues;
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
