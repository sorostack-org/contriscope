import type { IssueAssessment, OutputFormat, RepoReadiness, WaveSuggestion } from "./types";
export interface RenderOptions {
    colors?: boolean;
    includeRaw?: boolean;
}
export declare function renderIssueAssessment(assessment: IssueAssessment, format?: OutputFormat, options?: RenderOptions): string;
export declare function renderRepoReadiness(report: RepoReadiness, format?: OutputFormat, options?: RenderOptions): string;
export declare function renderWaveSuggestion(wave: WaveSuggestion): string;
//# sourceMappingURL=report.d.ts.map