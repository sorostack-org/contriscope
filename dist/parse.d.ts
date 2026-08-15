import type { Issue } from "./types";
export interface ParsedIssue {
    issue: Issue;
    format: "markdown" | "json";
}
export declare function parseIssueFromMarkdown(content: string): Issue;
export declare function parseIssueFromJson(content: string): Issue;
export declare function parseIssueInput(content: string, filename?: string): ParsedIssue;
export declare function parseIssuesFromDirectory(content: string, filename: string): Issue[];
//# sourceMappingURL=parse.d.ts.map