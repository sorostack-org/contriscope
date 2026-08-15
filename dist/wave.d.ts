import type { ContriscopeConfig } from "./config";
import type { WaveSuggestion } from "./types";
export interface WaveInput {
    config: ContriscopeConfig;
    title: string;
    body: string;
}
export declare function suggestWaveComplexity(input: WaveInput): WaveSuggestion;
//# sourceMappingURL=wave.d.ts.map