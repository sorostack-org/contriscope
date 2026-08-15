import type { Finding } from "../types";
export interface GuidanceInput {
    title: string;
    body: string;
}
export declare function checkGuidance(input: GuidanceInput): {
    score: number;
    findings: Finding[];
};
//# sourceMappingURL=guidance.d.ts.map