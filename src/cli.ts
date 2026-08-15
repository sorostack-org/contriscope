#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  DEFAULT_CONFIG,
  loadConfigFile,
  mergeConfig,
  type ContriscopeConfig,
  type DeepPartial,
} from "./config";
import { ContriscopeError, GitHubError, UsageError } from "./errors";
import {
  assessRepoReadiness,
  fetchAllOpenIssues,
  fetchRepoFile,
  fetchRepoMetadata,
  fetchRepoFiles,
  parseRepositorySlug,
} from "./index";
import { parseIssueInput, parseIssuesFromDirectory } from "./parse";
import { renderIssueAssessment, renderRepoReadiness } from "./report";
import { scoreIssue } from "./scorer";
import type { Issue, OutputFormat, RepoMetadata } from "./types";

const HELP = `ContriScope — contributor-ready issue scoping for funded open source on Stellar.

Usage:
  contriscope check <file|->             Score a single issue (file, JSON, or stdin '-')
  contriscope check-repo [options]       Produce a repository readiness report
  contriscope template [type] [options]  Show or write issue templates
  contriscope init [options]             Create .contriscope.json + issue templates
  contriscope config [options]           Print the effective configuration
  contriscope version                    Print the version
  contriscope help                       Show this help

Commands:
  check <file|->        Score one issue. <file> may be Markdown or JSON
                        (an object with { title, body, labels }). Use '-' for stdin.
                        Options: --config <path>, --format <text|json|markdown>,
                                 --no-stellar, --no-wave, --fail-below <n>

  check-repo            Analyse a repository. Provide either --slug owner/repo
                        (uses the GitHub API) or --path <dir> (local Markdown issues).
                        Options: --slug <owner/repo>, --owner <o> --repo <r>,
                                 --path <dir>, --token <token>, --format <fmt>,
                                 --fail-below <n>, --config <path>

  template [type]       Print an issue template. Types: good-first-issue, soroban,
                        feature, docs, bug, qa.
                        Add --write to save templates to .github/ISSUE_TEMPLATE
                        (use 'all' to write every template). Options: --dir <path>,
                                 --complexity <trivial|medium|high>

  init                  Scaffold .contriscope.json and issue templates.
                        Options: --dir <path>

  config                Print the effective configuration as JSON.
                        Options: --config <path>

Environment:
  GH_TOKEN or GITHUB_TOKEN  Used by check-repo when querying the GitHub API.

Exit codes:
  0  success
  1  an issue scored below the threshold, or the verdict is blocked
  2  usage error
`;

interface CliOptions {
  [key: string]: string | boolean;
}

interface ParsedCli {
  command: string;
  positional: string[];
  options: CliOptions;
}

export function parseArgs(argv: string[]): ParsedCli {
  const positional: string[] = [];
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      options.version = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        options[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        options[key] = next;
        i += 1;
      } else {
        options[key] = true;
      }
      continue;
    }
    positional.push(arg);
  }

  const command = positional[0];
  return { command, positional: positional.slice(1), options };
}

export async function run(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);

  if (parsed.options.help || parsed.command === "help") {
    process.stdout.write(HELP);
    return 0;
  }
  if (parsed.options.version || parsed.command === "version") {
    process.stdout.write(`${readVersion()}\n`);
    return 0;
  }

  try {
    switch (parsed.command) {
      case "check":
        return await runCheck(parsed);
      case "check-repo":
        return await runCheckRepo(parsed);
      case undefined:
        throw new UsageError("Missing command. Run `contriscope help` for usage.");
      default:
        throw new UsageError(
          `Unknown command "${parsed.command}". Run \`contriscope help\` for usage.`,
        );
    }
  } catch (error) {
    if (error instanceof ContriscopeError) {
      process.stderr.write(`Error: ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}

async function runCheckRepo(parsed: ParsedCli): Promise<number> {
  const options = parsed.options;
  const config = resolveConfig(options);
  const format = optionFormat(options);

  const pathArg = stringOption(options, "path");
  if (pathArg) {
    return runCheckRepoLocal(pathArg, config, format, options);
  }

  const slug = stringOption(options, "slug");
  const owner = stringOption(options, "owner");
  const repo = stringOption(options, "repo");
  if (!slug && (!owner || !repo)) {
    throw new UsageError(
      "check-repo needs --slug owner/repo (or --owner and --repo), or --path <dir>.",
    );
  }
  const resolved = slug
    ? parseRepositorySlug(slug)
    : { owner: owner as string, repo: repo as string };
  const token = tokenFromEnv(options);

  const repoMetadata = await fetchRepoMetadata(resolved.owner, resolved.repo, { token });
  const enriched = await enrichRepoMetadata(resolved.owner, resolved.repo, repoMetadata, { token });
  const issues = await fetchAllOpenIssues(resolved.owner, resolved.repo, { token });
  const report = assessRepoReadiness(enriched, { config, issues });
  process.stdout.write(
    `${renderRepoReadiness(report, format, { includeRaw: format === "json" })}\n`,
  );

  const blocked =
    report.programs.wave.verdict === "blocked" || report.programs.grantfox.verdict === "blocked";
  return computeExitCode(report.score, blocked, options);
}

async function runCheckRepoLocal(
  pathArg: string,
  config: ContriscopeConfig,
  format: OutputFormat,
  options: CliOptions,
): Promise<number> {
  const dir = resolve(pathArg);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new UsageError(`--path must point to an existing directory (got "${pathArg}").`);
  }

  const issues = readLocalIssues(dir);
  const repo = readLocalRepoMetadata(dir, basename(dir));
  const report = assessRepoReadiness(repo, { config, issues });
  process.stdout.write(
    `${renderRepoReadiness(report, format, { includeRaw: format === "json" })}\n`,
  );

  const blocked =
    report.programs.wave.verdict === "blocked" || report.programs.grantfox.verdict === "blocked";
  return computeExitCode(report.score, blocked, options);
}

function readLocalIssues(dir: string): Issue[] {
  const files = readdirSync(dir).filter((name) => name.endsWith(".md") || name.endsWith(".json"));
  const issues: Issue[] = [];
  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf8");
    issues.push(...parseIssuesFromDirectory(content, file));
  }
  return issues;
}

function readLocalRepoMetadata(dir: string, name: string): RepoMetadata {
  const has = (path: string) => existsSync(join(dir, path));
  const readme = has("README.md") ? readFileSync(join(dir, "README.md"), "utf8") : undefined;
  return {
    name,
    hasREADME: has("README.md"),
    readmeLength: readme?.length,
    hasContributing: has("CONTRIBUTING.md"),
    hasLicense: has("LICENSE") || has("LICENSE.md"),
    hasCodeOfConduct: has("CODE_OF_CONDUCT.md") || has("CODE_OF_CONDUCT"),
    hasSecurity: has("SECURITY.md"),
    hasDocs: has("docs"),
    hasCi: has(".github/workflows"),
    hasIssueTemplates: has(".github/ISSUE_TEMPLATE"),
    hasPullRequestTemplates: has(".github/PULL_REQUEST_TEMPLATE.md"),
  };
}

async function enrichRepoMetadata(
  owner: string,
  repo: string,
  metadata: RepoMetadata,
  credentials: { token?: string },
): Promise<RepoMetadata> {
  const rootFiles = await fetchRepoFiles(owner, repo, "", credentials).catch(() => [] as string[]);
  const has = (name: string) => rootFiles.includes(name);
  const readme = has("README.md")
    ? await fetchRepoFile(owner, repo, "README.md", credentials)
    : undefined;
  const docsDir = rootFiles.some((name) => name === "docs" || name === "documentation");
  const workflows = has(".github")
    ? await fetchRepoFiles(owner, repo, ".github/workflows", credentials).catch(
        () => [] as string[],
      )
    : [];
  const issueTemplates = has(".github")
    ? await fetchRepoFiles(owner, repo, ".github/ISSUE_TEMPLATE", credentials).catch(
        () => [] as string[],
      )
    : [];
  const dotGithubFiles = has(".github")
    ? await fetchRepoFiles(owner, repo, ".github", credentials).catch(() => [] as string[])
    : [];

  return {
    ...metadata,
    hasREADME: has("README.md"),
    readmeLength: readme?.length,
    hasContributing: has("CONTRIBUTING.md"),
    hasLicense: rootFiles.some((name) => /^licen[cs]e/i.test(name)),
    hasCodeOfConduct: rootFiles.some((name) => /code[_ -]?of[-_ ]?conduct/i.test(name)),
    hasSecurity: has("SECURITY.md"),
    hasDocs: docsDir,
    hasCi: workflows.length > 0,
    hasIssueTemplates: issueTemplates.length > 0,
    hasPullRequestTemplates: dotGithubFiles.some(
      (name) => name.toLowerCase() === "pull_request_template.md",
    ),
  };
}

function tokenFromEnv(options: CliOptions): string | undefined {
  const explicit = stringOption(options, "token");
  if (explicit) {
    return explicit;
  }
  return process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
}

async function runCheck(parsed: ParsedCli): Promise<number> {
  const target = parsed.positional[0];
  if (!target) {
    throw new UsageError("Missing issue input. Usage: contriscope check <file|->");
  }

  const content = target === "-" ? await readStdin() : readFile(target);
  const filename = target === "-" ? undefined : target;
  const { issue } = parseIssueInput(content, filename);
  const config = resolveConfig(parsed.options);
  const assessment = scoreIssue(issue, { config });
  const format = optionFormat(parsed.options);
  const colors = Boolean(process.stdout.isTTY);

  process.stdout.write(
    `${renderIssueAssessment(assessment, format, { colors, includeRaw: format === "json" })}\n`,
  );

  return computeExitCode(assessment.score, assessment.verdict === "blocked", parsed.options);
}

function resolveConfig(options: CliOptions): ContriscopeConfig {
  const configPath = stringOption(options, "config");
  const base = configPath ? loadConfigFile(configPath) : DEFAULT_CONFIG;
  const overrides: DeepPartial<ContriscopeConfig> = {};

  if (options["no-stellar"]) {
    overrides.stellar = false;
  }
  if (options["no-wave"]) {
    overrides.program = { ...(overrides.program ?? {}), wave: false };
  }
  return mergeConfig(overrides, base);
}

function optionFormat(options: CliOptions): OutputFormat {
  const value = stringOption(options, "format");
  if (!value) {
    return "text";
  }
  if (value === "json" || value === "markdown" || value === "text") {
    return value;
  }
  throw new UsageError(`Invalid --format "${value}". Expected text, json, or markdown.`);
}

function computeExitCode(score: number, blocked: boolean, options: CliOptions): number {
  const failBelow = stringOption(options, "fail-below");
  if (failBelow !== undefined) {
    const threshold = Number(failBelow);
    if (Number.isNaN(threshold)) {
      throw new UsageError(`Invalid --fail-below value "${failBelow}". Expected a number.`);
    }
    return score < threshold ? 1 : 0;
  }
  return blocked ? 1 : 0;
}

function readFile(target: string): string {
  if (!existsSync(target)) {
    throw new UsageError(`File not found: ${target}`);
  }
  return readFileSync(target, "utf8");
}

function readStdin(): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", (error) => reject(error));
  });
}

function stringOption(options: CliOptions, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function readVersion(): string {
  try {
    const packageJson = readFileSync(join(__dirname, "..", "package.json"), "utf8");
    const parsed = JSON.parse(packageJson) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function main(): Promise<void> {
  try {
    const exitCode = await run(process.argv.slice(2));
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) {
  void main();
}
