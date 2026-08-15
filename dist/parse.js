"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIssueFromMarkdown = parseIssueFromMarkdown;
exports.parseIssueFromJson = parseIssueFromJson;
exports.parseIssueInput = parseIssueInput;
exports.parseIssuesFromDirectory = parseIssuesFromDirectory;
const errors_1 = require("./errors");
function parseIssueFromMarkdown(content) {
    let frontmatter = {};
    let body = content;
    if (content.startsWith("---")) {
        const end = content.indexOf("\n---", 4);
        if (end !== -1) {
            const rawFrontmatter = content.slice(4, end);
            body = content.slice(end + 4).replace(/^\n/, "");
            frontmatter = parseFrontmatter(rawFrontmatter);
        }
    }
    let resolvedTitle = frontmatter.title ?? "";
    if (!resolvedTitle) {
        const heading = body.match(/^#\s+(.+)$/m);
        resolvedTitle = heading ? heading[1].trim() : "";
    }
    const labels = parseLabels(frontmatter.labels);
    return {
        title: resolvedTitle,
        body,
        labels,
    };
}
function parseIssueFromJson(content) {
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new errors_1.InputError(`Input is not valid JSON: ${detail}`);
    }
    if (Array.isArray(parsed)) {
        throw new errors_1.InputError("Expected a single issue object. Use `contriscope check-repo` to analyse multiple issues.");
    }
    if (typeof parsed !== "object" || parsed === null) {
        throw new errors_1.InputError("Expected an issue object with `title` and `body`.");
    }
    const record = parsed;
    const title = typeof record.title === "string" ? record.title : "";
    const body = typeof record.body === "string" ? record.body : "";
    if (!title && !body) {
        throw new errors_1.InputError("Issue object must contain a `title` or a `body`.");
    }
    const issue = {
        title,
        body,
        labels: Array.isArray(record.labels) ? record.labels.map(String) : undefined,
        number: typeof record.number === "number" ? record.number : undefined,
        url: typeof record.url === "string" ? record.url : undefined,
        state: typeof record.state === "string" ? record.state : undefined,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
        comments: typeof record.comments === "number" ? record.comments : undefined,
    };
    return issue;
}
function parseIssueInput(content, filename) {
    if (filename && filename.toLowerCase().endsWith(".json")) {
        return { issue: parseIssueFromJson(content), format: "json" };
    }
    if (filename && filename.toLowerCase().endsWith(".md")) {
        return { issue: parseIssueFromMarkdown(content), format: "markdown" };
    }
    const trimmed = content.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        return { issue: parseIssueFromJson(content), format: "json" };
    }
    return { issue: parseIssueFromMarkdown(content), format: "markdown" };
}
function parseIssuesFromDirectory(content, filename) {
    if (filename.toLowerCase().endsWith(".json")) {
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new errors_1.InputError(`File "${filename}" is not valid JSON: ${detail}`);
        }
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => {
                const record = entry;
                return {
                    title: typeof record.title === "string" ? record.title : "",
                    body: typeof record.body === "string" ? record.body : "",
                    labels: Array.isArray(record.labels) ? record.labels.map(String) : undefined,
                    number: typeof record.number === "number" ? record.number : undefined,
                };
            });
        }
        const record = parsed;
        if (typeof record === "object" && record !== null && "issues" in record) {
            const list = record.issues;
            if (Array.isArray(list)) {
                return list.map((entry) => {
                    const item = entry;
                    return {
                        title: typeof item.title === "string" ? item.title : "",
                        body: typeof item.body === "string" ? item.body : "",
                        labels: Array.isArray(item.labels) ? item.labels.map(String) : undefined,
                    };
                });
            }
        }
        throw new errors_1.InputError(`File "${filename}" should contain an array of issues.`);
    }
    return [parseIssueFromMarkdown(content)];
}
function parseFrontmatter(raw) {
    const result = {};
    for (const line of raw.split("\n")) {
        const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
        if (match) {
            result[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
        }
    }
    return result;
}
function parseLabels(raw) {
    if (!raw) {
        return undefined;
    }
    const inner = raw.trim();
    if (inner.startsWith("[")) {
        try {
            const parsed = JSON.parse(inner);
            return Array.isArray(parsed) ? parsed.map(String) : undefined;
        }
        catch {
            return undefined;
        }
    }
    if (inner.includes(",")) {
        return inner.split(",").map((label) => label.trim());
    }
    return [inner];
}
