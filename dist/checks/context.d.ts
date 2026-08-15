import type { Finding } from "../types";
export interface ContextInput {
    title: string;
    body: string;
}
export declare function checkContext(input: ContextInput): {
    score: number;
    findings: Finding[];
};
//# sourceMappingURL=context.d.ts.map