import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
export declare const ACCEPTANCE_HEADINGS: string[];
export interface AcceptanceInput {
    config: ContriscopeConfig;
    body: string;
}
export declare function checkAcceptance(input: AcceptanceInput): {
    score: number;
    findings: Finding[];
};
//# sourceMappingURL=acceptance.d.ts.map