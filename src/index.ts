export * from "./types";
export * from "./errors";
export { VERSION } from "./version";

export {
  DEFAULT_CONFIG,
  deepMerge,
  mergeConfig,
  validateConfig,
  loadConfig,
  loadConfigFile,
  pickConfigPath,
} from "./config";
export type { ContriscopeConfig, DeepPartial, Weights, LoadedConfig } from "./config";

export { scoreIssue, computeVerdict, buildSummary, worstFindings } from "./scorer";
export type { ScoreIssueOptions } from "./scorer";

export { suggestWaveComplexity } from "./wave";
export type { WaveInput } from "./wave";

export { assessRepoReadiness, summarizeReadiness } from "./readiness";
export type { AssessRepoReadinessOptions } from "./readiness";

export { renderIssueAssessment, renderRepoReadiness, renderWaveSuggestion } from "./report";
export type { RenderOptions } from "./report";

export {
  githubRequest,
  fetchIssue,
  fetchIssues,
  fetchAllOpenIssues,
  fetchRepoMetadata,
  fetchRepoFiles,
  fetchRepoFile,
  fetchRepoFileExistence,
  postComment,
  parseRepositorySlug,
  parseLinkHeader,
  mapGitHubIssue,
  mapGitHubRepo,
} from "./github";
export type { GitHubCredentials, FetchIssuesOptions } from "./github";

export {
  renderTemplate,
  renderTemplatesConfig,
  writeIssueTemplates,
  templateTypeFromName,
  TEMPLATE_TYPES,
} from "./templates";
export type { TemplateType, RenderTemplateOptions, WriteTemplatesOptions } from "./templates";

export {
  parseIssueFromMarkdown,
  parseIssueFromJson,
  parseIssueInput,
  parseIssuesFromDirectory,
} from "./parse";
export type { ParsedIssue } from "./parse";

export { checkClarity } from "./checks/clarity";
export { checkScope } from "./checks/scope";
export { checkAcceptance, ACCEPTANCE_HEADINGS } from "./checks/acceptance";
export { checkContext } from "./checks/context";
export { checkGuidance } from "./checks/guidance";
export { checkMetadata } from "./checks/metadata";
export { checkStellar, hasStellarContent } from "./checks/stellar";
export { runChecks } from "./checks";
export type { RunChecksOptions, RunChecksResult } from "./checks";
