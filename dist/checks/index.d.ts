import type { ContriscopeConfig } from "../config";
import type { DimensionScore, Finding, Issue } from "../types";
export interface RunChecksOptions {
    config: ContriscopeConfig;
    issue: Issue;
}
export interface RunChecksResult {
    dimensions: DimensionScore[];
    findings: Finding[];
}
export declare function runChecks({ config, issue }: RunChecksOptions): RunChecksResult;
//# sourceMappingURL=index.d.ts.map