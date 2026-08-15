import type { Finding, Severity } from "../types";
export declare function severityPenalty(severity: Severity): number;
export declare function clampScore(score: number): number;
export declare function makeFinding(id: string, dimension: Finding["dimension"], severity: Severity, title: string, message: string, suggestion?: string): Finding;
//# sourceMappingURL=helpers.d.ts.map