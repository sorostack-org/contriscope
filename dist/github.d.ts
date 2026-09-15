import type { Issue, RepoMetadata } from "./types";
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
interface GitHubIssueResponse {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    created_at: string;
    updated_at: string;
    comments: number;
    labels?: {
        name: string;
    }[];
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
export declare function parseLinkHeader(header: string | null | undefined): LinkHeaderResult;
export declare function githubRequest<T>(path: string, credentials?: GitHubCredentials): Promise<T>;
export declare function fetchIssue(owner: string, repo: string, number: number, credentials?: GitHubCredentials): Promise<Issue>;
export declare function fetchIssues(owner: string, repo: string, credentials?: GitHubCredentials, options?: FetchIssuesOptions): Promise<Issue[]>;
export declare function fetchAllOpenIssues(owner: string, repo: string, credentials?: GitHubCredentials, options?: FetchIssuesOptions): Promise<Issue[]>;
export declare function fetchRepoMetadata(owner: string, repo: string, credentials?: GitHubCredentials): Promise<RepoMetadata>;
export declare function postComment(owner: string, repo: string, issueNumber: number, body: string, credentials?: GitHubCredentials): Promise<void>;
export declare function fetchRepoFileExistence(owner: string, repo: string, path: string, credentials?: GitHubCredentials): Promise<boolean>;
export declare function fetchRepoFile(owner: string, repo: string, path: string, credentials?: GitHubCredentials): Promise<string | undefined>;
export declare function fetchRepoFiles(owner: string, repo: string, path?: string, credentials?: GitHubCredentials): Promise<string[]>;
export declare function mapGitHubIssue(issue: GitHubIssueResponse): Issue;
export declare function mapGitHubRepo(repo: GitHubRepoResponse): RepoMetadata;
export declare function parseRepositorySlug(slug: string): {
    owner: string;
    repo: string;
};
export {};
//# sourceMappingURL=github.d.ts.map