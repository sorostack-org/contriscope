"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLinkHeader = parseLinkHeader;
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
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 250;
const MAX_RETRY_WAIT_MS = 10_000;
const MAX_PAGES_DEFAULT = 50;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseRetryAfter(header) {
    if (!header) {
        return undefined;
    }
    const seconds = Number(header);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
function parseLinkHeader(header) {
    const result = {};
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
async function githubFetch(path, credentials = {}, options = {}) {
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
    let retryAfterSeconds;
    for (let attempt = 0;; attempt += 1) {
        let response;
        try {
            response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new errors_1.GitHubError(`Network error while reaching the GitHub API: ${detail}`);
        }
        if (response.ok) {
            return response;
        }
        const remaining = response.headers.get("x-ratelimit-remaining");
        lastStatus = response.status;
        rateLimited = response.status === 403 && remaining === "0";
        retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"));
        const isSecondaryLimit = (response.status === 403 || response.status === 429) && remaining !== "0";
        const isTransientServerError = response.status === 502 || response.status === 503 || response.status === 504;
        const retryable = !rateLimited && (isSecondaryLimit || isTransientServerError) && attempt < maxRetries;
        if (retryable) {
            const delayMs = retryAfterSeconds !== undefined
                ? Math.min(retryAfterSeconds * 1000, MAX_RETRY_WAIT_MS)
                : retryBaseMs * 2 ** attempt;
            await sleep(delayMs);
            continue;
        }
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
        throw new errors_1.GitHubError(message, { status: response.status, rateLimited, retryAfterSeconds });
    }
}
async function githubRequest(path, credentials = {}) {
    const response = await githubFetch(path, credentials);
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
async function fetchAllOpenIssues(owner, repo, credentials = {}, options = {}) {
    const { perPage = 100, excludePullRequests = true, maxPages = MAX_PAGES_DEFAULT } = options;
    const issues = [];
    let page = 1;
    for (;;) {
        if (page > maxPages) {
            throw new errors_1.GitHubError(`Pagination exceeded ${maxPages} pages for ${owner}/${repo}; aborting to avoid an unbounded loop.`);
        }
        const response = await githubFetch(`/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}&page=${page}`, credentials);
        const raw = (await response.json());
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
    };
}
async function postComment(owner, repo, issueNumber, body, credentials = {}) {
    await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, credentials, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
        retries: 0,
    });
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
