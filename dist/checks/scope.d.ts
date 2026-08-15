import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
export interface ScopeInput {
    config: ContriscopeConfig;
    title: string;
    body: string;
}
export declare function checkScope(input: ScopeInput): {
    score: number;
    findings: Finding[];
};
//# sourceMappingURL=scope.d.ts.map