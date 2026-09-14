import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
export interface StellarInput {
    config: ContriscopeConfig;
    title: string;
    body: string;
}
export interface StellarResult {
    active: boolean;
    score: number;
    findings: Finding[];
}
export declare function hasStellarContent(input: {
    title: string;
    body: string;
}): boolean;
export declare function checkStellar(input: StellarInput): StellarResult;
//# sourceMappingURL=stellar.d.ts.map