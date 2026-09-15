export class ContriscopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContriscopeError";
  }
}

export class ConfigError extends ContriscopeError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class UsageError extends ContriscopeError {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export class InputError extends ContriscopeError {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export interface GitHubErrorOptions {
  status?: number;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

export class GitHubError extends ContriscopeError {
  status?: number;
  rateLimited: boolean;
  retryAfterSeconds?: number;

  constructor(message: string, options: GitHubErrorOptions = {}) {
    super(message);
    this.name = "GitHubError";
    this.status = options.status;
    this.rateLimited = options.rateLimited ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}
