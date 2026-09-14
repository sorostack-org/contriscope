import { appendFileSync, readFileSync } from "node:fs";
import {
  DEFAULT_CONFIG,
  loadConfigFile,
  mergeConfig,
  type ContriscopeConfig,
  type DeepPartial,
} from "./config";
import { GitHubError } from "./errors";
import {
  assessRepoReadiness,
  fetchAllOpenIssues,
  fetchRepoMetadata,
  postComment,
  renderIssueAssessment,
  renderRepoReadiness,
} from "./index";
import { scoreIssue } from "./scorer";
import type { Issue } from "./types";

interface ActionInputs {
  mode: "issue" | "report";
  comment: boolean;
  owner?: string;
  repo?: string;
  issueNumber?: number;
  token?: string;
  failBelow?: number;
  stellar: boolean;
  wave: boolean;
  grantfox: boolean;
}

interface GitHubEvent {
  issue?: {
    number?: number;
    title?: string;
    body?: string;
    labels?: { name: string }[];
  };
  pull_request?: {
    number?: number;
    title?: string;
    body?: string;
    labels?: { name: string }[];
  };
}

export function readActionInputs(): ActionInputs {
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const [owner, repo] = repository.split("/");

  const mode = readInput("mode") === "report" ? "report" : "issue";
  const issueNumber = parseOptionalNumber(readInput("issue-number"));
  const failBelow = parseOptionalNumber(readInput("fail-below"));

  const configPath = readInput("config");
  const stellarOverride = readOptionalBoolean(readInput("stellar"));
  const waveOverride = readOptionalBoolean(readInput("wave"));
  const grantfoxOverride = readOptionalBoolean(readInput("grantfox"));

  return {
    mode,
    comment: readInput("comment") === "true",
    owner: readInput("owner") || owner,
    repo: readInput("repo") || repo,
    issueNumber,
    token: readInput("token") || process.env.GITHUB_TOKEN,
    failBelow,
    stellar: stellarOverride !== false,
    wave: waveOverride !== false,
    grantfox: grantfoxOverride !== false,
  };
}

export async function runAction(inputs: ActionInputs): Promise<number> {
  const config = buildActionConfig(inputs, readInput("config"));
  const credentials = { token: inputs.token };

  if (inputs.mode === "report") {
    return runReportMode(inputs, config, credentials);
  }
  return runIssueMode(inputs, config, credentials);
}

async function runIssueMode(
  inputs: ActionInputs,
  config: ContriscopeConfig,
  credentials: { token?: string },
): Promise<number> {
  const event = readEventPayload();
  const issueEvent = event.issue ?? event.pull_request;
  const number = inputs.issueNumber ?? issueEvent?.number;

  if (!number) {
    return 0;
  }

  const issue: Issue = {
    number,
    title: issueEvent?.title ?? "Untitled issue",
    body: issueEvent?.body ?? "",
    labels: issueEvent?.labels?.map((label) => label.name),
  };

  const assessment = scoreIssue(issue, { config });
  const markdown = renderIssueAssessment(assessment, "markdown", { includeRaw: false });

  if (inputs.comment && inputs.owner && inputs.repo && inputs.token) {
    await postComment(inputs.owner, inputs.repo, number, markdown, credentials);
  }

  writeOutput("score", String(assessment.score));
  writeOutput("verdict", assessment.verdict);
  if (assessment.wave) {
    writeOutput("wave-level", assessment.wave.level);
    writeOutput("wave-points", String(assessment.wave.points));
  }

  if (inputs.failBelow !== undefined && assessment.score < inputs.failBelow) {
    return 1;
  }
  return 0;
}

async function runReportMode(
  inputs: ActionInputs,
  config: ContriscopeConfig,
  credentials: { token?: string },
): Promise<number> {
  if (!inputs.owner || !inputs.repo) {
    throw new GitHubError("GITHUB_REPOSITORY is required to run the report mode.");
  }

  const repo = await fetchRepoMetadata(inputs.owner, inputs.repo, credentials);
  const issues = await fetchAllOpenIssues(inputs.owner, inputs.repo, credentials);
  const report = assessRepoReadiness(repo, { config, issues });
  const markdown = renderRepoReadiness(report, "markdown", { includeRaw: false });

  writeSummary(markdown);

  if (inputs.comment && inputs.issueNumber && inputs.token) {
    await postComment(inputs.owner, inputs.repo, inputs.issueNumber, markdown, credentials);
  }

  writeOutput("score", String(report.score));
  writeOutput("grade", report.grade);
  writeOutput("wave-score", String(report.programs.wave.score));
  writeOutput("grantfox-score", String(report.programs.grantfox.score));

  if (inputs.failBelow !== undefined && report.score < inputs.failBelow) {
    return 1;
  }
  return 0;
}

function buildActionConfig(inputs: ActionInputs, configPath: string): ContriscopeConfig {
  let base: ContriscopeConfig = DEFAULT_CONFIG;
  if (configPath) {
    base = loadConfigFile(configPath);
  }
  const overrides: DeepPartial<ContriscopeConfig> = {};
  if (!inputs.stellar) {
    overrides.stellar = false;
  }
  if (!inputs.wave) {
    overrides.program = { ...(overrides.program ?? {}), wave: false };
  }
  if (!inputs.grantfox) {
    overrides.program = { ...(overrides.program ?? {}), grantfox: false };
  }
  return mergeConfig(overrides, base);
}

function readInput(name: string): string {
  const key = `INPUT_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  return process.env[key] ?? "";
}

function readOptionalBoolean(value: string): boolean | undefined {
  if (value === "" || value === undefined) {
    return undefined;
  }
  return value === "true";
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function readEventPayload(): GitHubEvent {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) {
    return {};
  }
  return JSON.parse(readFileSync(path, "utf8")) as GitHubEvent;
}

function writeOutput(name: string, value: string): void {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) {
    return;
  }
  const safeValue = value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  appendFileSync(path, `${name}=${safeValue}\n`, "utf8");
}

function writeSummary(content: string): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) {
    process.stdout.write(content);
    return;
  }
  appendFileSync(path, content, "utf8");
}

export async function main(): Promise<void> {
  try {
    const inputs = readActionInputs();
    const exitCode = await runAction(inputs);
    process.exitCode = exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`contriscope-action: ${message}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) {
  void main();
}
