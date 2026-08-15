import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
export interface ClarityInput {
    config: ContriscopeConfig;
    title: string;
    body: string;
    prose: string;
}
export declare function checkClarity(input: ClarityInput): {
    score: number;
    findings: Finding[];
};
export declare function countVagueTerms(body: string, config: ContriscopeConfig): number;
//# sourceMappingURL=clarity.d.ts.map