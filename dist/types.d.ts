export type Severity = "info" | "warning" | "error";
export type DimensionId = "clarity" | "scope" | "acceptance" | "context" | "guidance" | "metadata" | "stellar";
export type Verdict = "ready" | "needs-work" | "blocked";
export interface Finding {
    id: string;
    dimension: DimensionId;
    severity: Severity;
    title: string;
    message: string;
    suggestion?: string;
}
export interface DimensionScore {
    id: DimensionId;
    label: string;
    score: number;
    weight: number;
    findings: Finding[];
}
export interface Issue {
    number?: number;
    title: string;
    body: string;
    labels?: string[];
    url?: string;
    state?: string;
    createdAt?: string;
    updatedAt?: string;
    comments?: number;
}
export interface IssueAssessment {
    issue: Issue;
    score: number;
    verdict: Verdict;
    reason: string;
    dimensions: DimensionScore[];
    findings: Finding[];
    wave?: WaveSuggestion;
    summary: string;
}
export type WaveLevel = "trivial" | "medium" | "high";
export interface WaveSuggestion {
    level: WaveLevel;
    points: number;
    signals: string[];
    reasoning: string;
    confidence: number;
}
export interface RepoMetadata {
    name: string;
    owner?: string;
    description?: string;
    defaultBranch?: string;
    hasREADME?: boolean;
    readmeLength?: number;
    hasContributing?: boolean;
    hasLicense?: boolean;
    hasCodeOfConduct?: boolean;
    hasSecurity?: boolean;
    hasDocs?: boolean;
    hasCi?: boolean;
    hasIssueTemplates?: boolean;
    hasPullRequestTemplates?: boolean;
    openIssues?: number;
    closedIssues?: number;
    openPullRequests?: number;
    stars?: number;
    forks?: number;
    primaryLanguage?: string;
    homepage?: string;
}
export interface ReadinessSection {
    id: string;
    label: string;
    score: number;
    weight: number;
    findings: Finding[];
}
export interface ProgramChecklistItem {
    id: string;
    label: string;
    met: boolean;
    detail: string;
}
export interface ProgramReadiness {
    name: "drips-wave" | "grantfox";
    label: string;
    score: number;
    verdict: Verdict;
    checklist: ProgramChecklistItem[];
}
export interface RepoReadiness {
    repo: RepoMetadata;
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    sections: ReadinessSection[];
    findings: Finding[];
    programs: {
        wave: ProgramReadiness;
        grantfox: ProgramReadiness;
    };
    issuesScored: number;
    issuesTotal: number;
}
export type OutputFormat = "text" | "json" | "markdown";
//# sourceMappingURL=types.d.ts.map