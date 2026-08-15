export interface Weights {
    clarity: number;
    scope: number;
    acceptance: number;
    context: number;
    guidance: number;
    metadata: number;
    stellar: number;
}
export interface ContriscopeConfig {
    program: {
        wave: boolean;
        grantfox: boolean;
    };
    stellar: boolean;
    weights: Weights;
    verdict: {
        ready: number;
        needsWork: number;
    };
    minDescriptionLength: number;
    minBodyWords: number;
    title: {
        min: number;
        max: number;
    };
    vagueTerms: string[];
    placeholderTokens: string[];
    largeScopePhrases: string[];
    labels: {
        goodFirstIssue: string;
        wave: string;
        complexity: {
            trivial: string;
            medium: string;
            high: string;
        };
    };
    wave: {
        points: {
            trivial: number;
            medium: number;
            high: number;
        };
        highSignals: string[];
        mediumSignals: string[];
        trivialSignals: string[];
    };
    repo: {
        minReadmeLength: number;
        goodFirstIssueTarget: number;
    };
}
export declare const DEFAULT_CONFIG: ContriscopeConfig;
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
export declare function deepMerge<T>(base: T, overrides: DeepPartial<T>): T;
export declare function validateConfig(config: ContriscopeConfig): void;
export declare function mergeConfig(overrides?: DeepPartial<ContriscopeConfig>, base?: ContriscopeConfig): ContriscopeConfig;
export interface LoadedConfig {
    config: ContriscopeConfig;
    path?: string;
}
export declare function loadConfigFile(path: string): ContriscopeConfig;
export declare function loadConfig(path?: string): LoadedConfig;
export declare function pickConfigPath(candidates: string[]): string | undefined;
//# sourceMappingURL=config.d.ts.map