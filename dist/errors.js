"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubError = exports.InputError = exports.UsageError = exports.ConfigError = exports.ContriscopeError = void 0;
class ContriscopeError extends Error {
    constructor(message) {
        super(message);
        this.name = "ContriscopeError";
    }
}
exports.ContriscopeError = ContriscopeError;
class ConfigError extends ContriscopeError {
    constructor(message) {
        super(message);
        this.name = "ConfigError";
    }
}
exports.ConfigError = ConfigError;
class UsageError extends ContriscopeError {
    constructor(message) {
        super(message);
        this.name = "UsageError";
    }
}
exports.UsageError = UsageError;
class InputError extends ContriscopeError {
    constructor(message) {
        super(message);
        this.name = "InputError";
    }
}
exports.InputError = InputError;
class GitHubError extends ContriscopeError {
    status;
    rateLimited;
    retryAfterSeconds;
    constructor(message, options = {}) {
        super(message);
        this.name = "GitHubError";
        this.status = options.status;
        this.rateLimited = options.rateLimited ?? false;
        this.retryAfterSeconds = options.retryAfterSeconds;
    }
}
exports.GitHubError = GitHubError;
