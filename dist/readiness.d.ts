import { type ContriscopeConfig } from "./config";
import type { Issue, RepoMetadata, RepoReadiness } from "./types";
export interface AssessRepoReadinessOptions {
    config?: ContriscopeConfig;
    issues?: Issue[];
}
export declare function assessRepoReadiness(repo: RepoMetadata, options?: AssessRepoReadinessOptions): RepoReadiness;
export declare function summarizeReadiness(report: RepoReadiness): string;
//# sourceMappingURL=readiness.d.ts.map