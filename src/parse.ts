import type { Issue } from "./types";

export interface ParsedIssue {
  issue: Issue;
  format: "markdown" | "json";
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
