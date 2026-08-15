import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
export interface MetadataInput {
    config: ContriscopeConfig;
    labels?: string[];
}
export declare function checkMetadata(input: MetadataInput): {
    score: number;
    findings: Finding[];
};
//# sourceMappingURL=metadata.d.ts.map