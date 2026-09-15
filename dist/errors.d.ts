export declare class ContriscopeError extends Error {
    constructor(message: string);
}
export declare class ConfigError extends ContriscopeError {
    constructor(message: string);
}
export declare class UsageError extends ContriscopeError {
    constructor(message: string);
}
export declare class InputError extends ContriscopeError {
    constructor(message: string);
}
export interface GitHubErrorOptions {
    status?: number;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
}
export declare class GitHubError extends ContriscopeError {
    status?: number;
    rateLimited: boolean;
    retryAfterSeconds?: number;
    constructor(message: string, options?: GitHubErrorOptions);
}
//# sourceMappingURL=errors.d.ts.map