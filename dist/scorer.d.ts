import { type ContriscopeConfig, type DeepPartial } from "./config";
import type { DimensionScore, Finding, Issue, IssueAssessment, Verdict } from "./types";
export interface ScoreIssueOptions {
    config?: ContriscopeConfig;
    configOverrides?: DeepPartial<ContriscopeConfig>;
    includeWaveSuggestion?: boolean;
}
export declare function scoreIssue(issue: Issue, options?: ScoreIssueOptions): IssueAssessment;
export declare function verdictReason(verdict: Verdict, score: number, config: ContriscopeConfig, missingEssentials: boolean): string;
export declare function computeVerdict(score: number, config: ContriscopeConfig): Verdict;
export declare function buildSummary(title: string, score: number, verdict: Verdict, dimensions: DimensionScore[]): string;
export declare function worstFindings(findings: Finding[], limit?: number): Finding[];
//# sourceMappingURL=scorer.d.ts.map