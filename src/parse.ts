import { InputError } from "./errors";
import type { Issue } from "./types";

export interface ParsedIssue {
  issue: Issue;
  format: "markdown" | "json";
}

export function parseIssueFromJson(content: string): Issue {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new InputError(`Input is not valid JSON: ${detail}`);
  }

  if (Array.isArray(parsed)) {
    throw new InputError(
      "Expected a single issue object. Use `contriscope check-repo` to analyse multiple issues.",
    );
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new InputError("Expected an issue object with `title` and `body`.");
  }

  const record = parsed as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title : "";
  const body = typeof record.body === "string" ? record.body : "";
  if (!title && !body) {
    throw new InputError("Issue object must contain a `title` or a `body`.");
  }

  const issue: Issue = {
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

export function parseIssueInput(content: string, filename?: string): ParsedIssue {
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

export function parseIssueFromMarkdown(content: string): Issue {
  let frontmatter: Record<string, string> = {};
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

function parseFrontmatter(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function parseLabels(raw?: string): string[] | undefined {
  if (!raw) {
    return undefined;
  }
  const inner = raw.trim();
  if (inner.startsWith("[")) {
    try {
      const parsed = JSON.parse(inner) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : undefined;
    } catch {
      return undefined;
    }
  }
  if (inner.includes(",")) {
    return inner.split(",").map((label) => label.trim());
  }
  return [inner];
}
