"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readActionInputs = readActionInputs;
exports.runAction = runAction;
exports.main = main;
const node_fs_1 = require("node:fs");
const config_1 = require("./config");
const errors_1 = require("./errors");
const index_1 = require("./index");
const scorer_1 = require("./scorer");
function readActionInputs() {
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
async function runAction(inputs) {
    const config = buildActionConfig(inputs, readInput("config"));
    const credentials = { token: inputs.token };
    if (inputs.mode === "report") {
        return runReportMode(inputs, config, credentials);
    }
    return runIssueMode(inputs, config, credentials);
}
async function runIssueMode(inputs, config, credentials) {
    const event = readEventPayload();
    const issueEvent = event.issue ?? event.pull_request;
    const number = inputs.issueNumber ?? issueEvent?.number;
    if (!number) {
        return 0;
    }
    const issue = {
        number,
        title: issueEvent?.title ?? "Untitled issue",
        body: issueEvent?.body ?? "",
        labels: issueEvent?.labels?.map((label) => label.name),
    };
    const assessment = (0, scorer_1.scoreIssue)(issue, { config });
    const markdown = (0, index_1.renderIssueAssessment)(assessment, "markdown", { includeRaw: false });
    if (inputs.comment && inputs.owner && inputs.repo && inputs.token) {
        await (0, index_1.postComment)(inputs.owner, inputs.repo, number, markdown, credentials);
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
async function runReportMode(inputs, config, credentials) {
    if (!inputs.owner || !inputs.repo) {
        throw new errors_1.GitHubError("GITHUB_REPOSITORY is required to run the report mode.");
    }
    const repo = await (0, index_1.fetchRepoMetadata)(inputs.owner, inputs.repo, credentials);
    const issues = await (0, index_1.fetchAllOpenIssues)(inputs.owner, inputs.repo, credentials);
    const report = (0, index_1.assessRepoReadiness)(repo, { config, issues });
    const markdown = (0, index_1.renderRepoReadiness)(report, "markdown", { includeRaw: false });
    writeSummary(markdown);
    if (inputs.comment && inputs.issueNumber && inputs.token) {
        await (0, index_1.postComment)(inputs.owner, inputs.repo, inputs.issueNumber, markdown, credentials);
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
function buildActionConfig(inputs, configPath) {
    let base = config_1.DEFAULT_CONFIG;
    if (configPath) {
        base = (0, config_1.loadConfigFile)(configPath);
    }
    const overrides = {};
    if (!inputs.stellar) {
        overrides.stellar = false;
    }
    if (!inputs.wave) {
        overrides.program = { ...(overrides.program ?? {}), wave: false };
    }
    if (!inputs.grantfox) {
        overrides.program = { ...(overrides.program ?? {}), grantfox: false };
    }
    return (0, config_1.mergeConfig)(overrides, base);
}
function readInput(name) {
    const key = `INPUT_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
    return process.env[key] ?? "";
}
function readOptionalBoolean(value) {
    if (value === "" || value === undefined) {
        return undefined;
    }
    return value === "true";
}
function parseOptionalNumber(value) {
    if (!value) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}
function readEventPayload() {
    const path = process.env.GITHUB_EVENT_PATH;
    if (!path) {
        return {};
    }
    return JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
}
function writeOutput(name, value) {
    const path = process.env.GITHUB_OUTPUT;
    if (!path) {
        return;
    }
    const safeValue = value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    (0, node_fs_1.appendFileSync)(path, `${name}=${safeValue}\n`, "utf8");
}
function writeSummary(content) {
    const path = process.env.GITHUB_STEP_SUMMARY;
    if (!path) {
        process.stdout.write(content);
        return;
    }
    (0, node_fs_1.appendFileSync)(path, content, "utf8");
}
async function main() {
    try {
        const inputs = readActionInputs();
        const exitCode = await runAction(inputs);
        process.exitCode = exitCode;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`contriscope-action: ${message}\n`);
        process.exitCode = 2;
    }
}
if (require.main === module) {
    void main();
}
