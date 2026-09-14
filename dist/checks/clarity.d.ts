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
//# sourceMappingURL=clarity.d.ts.map