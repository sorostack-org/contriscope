"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubRequest = githubRequest;
exports.fetchIssue = fetchIssue;
exports.fetchIssues = fetchIssues;
exports.fetchAllOpenIssues = fetchAllOpenIssues;
exports.fetchRepoMetadata = fetchRepoMetadata;
exports.postComment = postComment;
exports.fetchRepoFileExistence = fetchRepoFileExistence;
exports.fetchRepoFile = fetchRepoFile;
exports.fetchRepoFiles = fetchRepoFiles;
exports.mapGitHubIssue = mapGitHubIssue;
exports.mapGitHubRepo = mapGitHubRepo;
exports.parseRepositorySlug = parseRepositorySlug;
const errors_1 = require("./errors");
const API_BASE = "https://api.github.com";
async function githubRequest(path, credentials = {}) {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "contriscope",
    };
    if (credentials.token) {
        headers.Authorization = `Bearer ${credentials.token}`;
    }
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, { headers });
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new errors_1.GitHubError(`Network error while reaching the GitHub API: ${detail}`);
    }
    if (!response.ok) {
        const rateLimited = response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
        let message = `GitHub API request failed with status ${response.status} for ${path}.`;
        try {
            const payload = (await response.json());
            if (payload.message) {
                message = payload.message;
            }
        }
        catch {
            // ignore body parse errors
        }
        throw new errors_1.GitHubError(message, { status: response.status, rateLimited });
    }
    return (await response.json());
}
async function fetchIssue(owner, repo, number, credentials = {}) {
    const payload = await githubRequest(`/repos/${owner}/${repo}/issues/${number}`, credentials);
    return mapGitHubIssue(payload);
}
async function fetchIssues(owner, repo, credentials = {}, options = {}) {
    const { state = "open", perPage = 100, page = 1, excludePullRequests = true } = options;
    const query = new URLSearchParams({ state, per_page: String(perPage), page: String(page) });
    const payload = await githubRequest(`/repos/${owner}/${repo}/issues?${query.toString()}`, credentials);
    return payload
        .filter((issue) => !excludePullRequests || issue.pull_request === undefined)
        .map(mapGitHubIssue);
}
async function fetchAllOpenIssues(owner, repo, credentials = {}) {
    const issues = [];
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
async function fetchRepoMetadata(owner, repo, credentials = {}) {
    const payload = await githubRequest(`/repos/${owner}/${repo}`, credentials);
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
async function postComment(owner, repo, issueNumber, body, credentials = {}) {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "contriscope",
        "Content-Type": "application/json",
    };
    if (credentials.token) {
        headers.Authorization = `Bearer ${credentials.token}`;
    }
    const response = await fetch(`${API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body }),
    });
    if (!response.ok) {
        const rateLimited = response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
        throw new errors_1.GitHubError(`Failed to post comment: GitHub API responded with status ${response.status}.`, { status: response.status, rateLimited });
    }
}
async function fetchRepoFileExistence(owner, repo, path, credentials = {}) {
    try {
        await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, credentials);
        return true;
    }
    catch (error) {
        if (error instanceof errors_1.GitHubError && error.status === 404) {
            return false;
        }
        throw error;
    }
}
async function fetchRepoFile(owner, repo, path, credentials = {}) {
    try {
        const payload = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, credentials);
        if (payload.content && payload.encoding === "base64") {
            return Buffer.from(payload.content, "base64").toString("utf8");
        }
        return undefined;
    }
    catch (error) {
        if (error instanceof errors_1.GitHubError && error.status === 404) {
            return undefined;
        }
        throw error;
    }
}
async function fetchRepoFiles(owner, repo, path = "", credentials = {}) {
    const payload = await githubRequest(`/repos/${owner}/${repo}/contents${path ? `/${encodeURIComponent(path)}` : ""}`, credentials);
    return payload.map((entry) => entry.name);
}
function mapGitHubIssue(issue) {
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
function mapGitHubRepo(repo) {
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
function parseRepositorySlug(slug) {
    const match = slug.match(/^(?:https?:\/\/)?(?:github\.com\/)?([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
    if (!match) {
        throw new errors_1.GitHubError(`Invalid repository slug "${slug}". Expected "owner/repo".`);
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}
