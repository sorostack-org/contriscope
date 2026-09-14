#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
exports.run = run;
exports.resolveConfig = resolveConfig;
exports.main = main;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const config_1 = require("./config");
const errors_1 = require("./errors");
const index_1 = require("./index");
const parse_1 = require("./parse");
const report_1 = require("./report");
const scorer_1 = require("./scorer");
const templates_1 = require("./templates");
const version_1 = require("./version");
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
                                 --no-stellar, --no-wave, --no-grantfox,
                                 --fail-below <n>

  check-repo            Analyse a repository. Provide either --slug owner/repo
                        (uses the GitHub API) or --path <dir> (local Markdown issues).
                        Options: --slug <owner/repo>, --owner <o> --repo <r>,
                                 --path <dir>, --token <token>, --format <fmt>,
                                 --fail-below <n>, --config <path>,
                                 --no-grantfox, --no-wave, --no-stellar

  template [type]       Print an issue template. Types: ${templates_1.TEMPLATE_TYPES.join(", ")}.
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
function parseArgs(argv) {
    const positional = [];
    const options = {};
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
            }
            else {
                options[key] = true;
            }
            continue;
        }
        positional.push(arg);
    }
    const command = positional[0];
    return { command, positional: positional.slice(1), options };
}
async function run(argv) {
    const parsed = parseArgs(argv);
    if (parsed.options.help || parsed.command === "help") {
        process.stdout.write(HELP);
        return 0;
    }
    if (parsed.options.version || parsed.command === "version") {
        process.stdout.write(`${version_1.VERSION}\n`);
        return 0;
    }
    try {
        switch (parsed.command) {
            case "check":
                return await runCheck(parsed);
            case "check-repo":
                return await runCheckRepo(parsed);
            case "template":
                return runTemplate(parsed);
            case "init":
                return runInit(parsed);
            case "config":
                return runConfig(parsed);
            case undefined:
                throw new errors_1.UsageError("Missing command. Run `contriscope help` for usage.");
            default:
                throw new errors_1.UsageError(`Unknown command "${parsed.command}". Run \`contriscope help\` for usage.`);
        }
    }
    catch (error) {
        if (error instanceof errors_1.ContriscopeError) {
            process.stderr.write(`Error: ${error.message}\n`);
            return 2;
        }
        throw error;
    }
}
async function runCheck(parsed) {
    const target = parsed.positional[0];
    if (!target) {
        throw new errors_1.UsageError("Missing issue input. Usage: contriscope check <file|->");
    }
    const content = target === "-" ? await readStdin() : readFile(target);
    const filename = target === "-" ? undefined : target;
    const { issue } = (0, parse_1.parseIssueInput)(content, filename);
    const config = resolveConfig(parsed.options);
    const assessment = (0, scorer_1.scoreIssue)(issue, { config });
    const format = optionFormat(parsed.options);
    const colors = Boolean(process.stdout.isTTY);
    process.stdout.write(`${(0, report_1.renderIssueAssessment)(assessment, format, { colors, includeRaw: format === "json" })}\n`);
    return computeExitCode(assessment.score, assessment.verdict === "blocked", parsed.options);
}
async function runCheckRepo(parsed) {
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
        throw new errors_1.UsageError("check-repo needs --slug owner/repo (or --owner and --repo), or --path <dir>.");
    }
    const resolved = slug
        ? (0, index_1.parseRepositorySlug)(slug)
        : { owner: owner, repo: repo };
    const token = tokenFromEnv(options);
    const repoMetadata = await (0, index_1.fetchRepoMetadata)(resolved.owner, resolved.repo, { token });
    const enriched = await enrichRepoMetadata(resolved.owner, resolved.repo, repoMetadata, { token });
    const issues = await (0, index_1.fetchAllOpenIssues)(resolved.owner, resolved.repo, { token });
    const report = (0, index_1.assessRepoReadiness)(enriched, { config, issues });
    process.stdout.write(`${(0, report_1.renderRepoReadiness)(report, format, { includeRaw: format === "json" })}\n`);
    const blocked = report.programs.wave.verdict === "blocked" || report.programs.grantfox.verdict === "blocked";
    return computeExitCode(report.score, blocked, options);
}
async function runCheckRepoLocal(pathArg, config, format, options) {
    const dir = (0, node_path_1.resolve)(pathArg);
    if (!(0, node_fs_1.existsSync)(dir) || !(0, node_fs_1.statSync)(dir).isDirectory()) {
        throw new errors_1.UsageError(`--path must point to an existing directory (got "${pathArg}").`);
    }
    const issues = readLocalIssues(dir);
    const repo = readLocalRepoMetadata(dir, (0, node_path_1.basename)(dir));
    const report = (0, index_1.assessRepoReadiness)(repo, { config, issues });
    process.stdout.write(`${(0, report_1.renderRepoReadiness)(report, format, { includeRaw: format === "json" })}\n`);
    const blocked = report.programs.wave.verdict === "blocked" || report.programs.grantfox.verdict === "blocked";
    return computeExitCode(report.score, blocked, options);
}
function runTemplate(parsed) {
    const typeArg = parsed.positional[0] ?? "all";
    const options = parsed.options;
    const writeEnabled = Boolean(options.write);
    const complexity = stringOption(options, "complexity");
    const waveLevel = complexity && ["trivial", "medium", "high"].includes(complexity)
        ? complexity
        : undefined;
    if (complexity && !waveLevel) {
        throw new errors_1.UsageError(`Invalid --complexity "${complexity}". Expected trivial, medium, or high.`);
    }
    if (typeArg === "all" && writeEnabled) {
        const dir = stringOption(options, "dir") ?? ".github/ISSUE_TEMPLATE";
        const written = (0, templates_1.writeIssueTemplates)(dir, { complexityByType: defaultComplexityByType() });
        process.stdout.write(`Wrote ${written.length} template file(s) to ${(0, node_path_1.resolve)(dir)}\n`);
        return 0;
    }
    if (typeArg === "all") {
        for (const type of templates_1.TEMPLATE_TYPES) {
            process.stdout.write(`### ${type}\n`);
            process.stdout.write(`${(0, templates_1.renderTemplate)(type, { complexity: waveLevel })}\n\n`);
        }
        return 0;
    }
    const type = (0, templates_1.templateTypeFromName)(typeArg);
    if (!type) {
        throw new errors_1.UsageError(`Unknown template type "${typeArg}". Available: ${templates_1.TEMPLATE_TYPES.join(", ")}`);
    }
    if (writeEnabled) {
        const dir = stringOption(options, "dir") ?? ".github/ISSUE_TEMPLATE";
        const written = (0, templates_1.writeIssueTemplates)(dir, {
            complexityByType: { [type]: waveLevel ?? "medium" },
        });
        process.stdout.write(`Wrote ${written.length} template file(s) to ${(0, node_path_1.resolve)(dir)}\n`);
        return 0;
    }
    process.stdout.write(`${(0, templates_1.renderTemplate)(type, { complexity: waveLevel })}\n`);
    return 0;
}
function defaultComplexityByType() {
    return {
        "good-first-issue": "trivial",
        soroban: "medium",
        feature: "medium",
        docs: "trivial",
        bug: "medium",
        qa: "trivial",
    };
}
function runInit(parsed) {
    const dir = (0, node_path_1.resolve)(stringOption(parsed.options, "dir") ?? ".");
    const configPath = (0, node_path_1.join)(dir, ".contriscope.json");
    const templateDir = (0, node_path_1.join)(dir, ".github", "ISSUE_TEMPLATE");
    const written = [];
    if (!(0, node_fs_1.existsSync)(configPath)) {
        writeJsonFile(configPath, config_1.DEFAULT_CONFIG);
        written.push(configPath);
    }
    const templateFiles = (0, templates_1.writeIssueTemplates)(templateDir, {
        complexityByType: defaultComplexityByType(),
    });
    written.push(...templateFiles);
    process.stdout.write(`Initialised ContriScope in ${dir}.\n${written.map((p) => `  - ${p}`).join("\n")}\n`);
    if ((0, node_fs_1.existsSync)(configPath) && written.indexOf(configPath) === -1) {
        process.stdout.write(`Note: ${configPath} already exists and was not overwritten.\n`);
    }
    return 0;
}
function runConfig(parsed) {
    const config = resolveConfig(parsed.options);
    process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
    return 0;
}
function resolveConfig(options) {
    const configPath = stringOption(options, "config");
    const base = configPath ? (0, config_1.loadConfigFile)(configPath) : config_1.DEFAULT_CONFIG;
    const overrides = {};
    if (options["no-stellar"]) {
        overrides.stellar = false;
    }
    if (options["no-wave"]) {
        overrides.program = { ...(overrides.program ?? {}), wave: false };
    }
    if (options["no-grantfox"]) {
        overrides.program = { ...(overrides.program ?? {}), grantfox: false };
    }
    return (0, config_1.mergeConfig)(overrides, base);
}
function optionFormat(options) {
    const value = stringOption(options, "format");
    if (!value) {
        return "text";
    }
    if (value === "json" || value === "markdown" || value === "text") {
        return value;
    }
    throw new errors_1.UsageError(`Invalid --format "${value}". Expected text, json, or markdown.`);
}
function computeExitCode(score, blocked, options) {
    const failBelow = stringOption(options, "fail-below");
    if (failBelow !== undefined) {
        const threshold = Number(failBelow);
        if (Number.isNaN(threshold)) {
            throw new errors_1.UsageError(`Invalid --fail-below value "${failBelow}". Expected a number.`);
        }
        return score < threshold ? 1 : 0;
    }
    return blocked ? 1 : 0;
}
function readFile(target) {
    if (!(0, node_fs_1.existsSync)(target)) {
        throw new errors_1.UsageError(`File not found: ${target}`);
    }
    return (0, node_fs_1.readFileSync)(target, "utf8");
}
function readStdin() {
    return new Promise((resolvePromise, reject) => {
        const chunks = [];
        process.stdin.on("data", (chunk) => chunks.push(chunk));
        process.stdin.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
        process.stdin.on("error", (error) => reject(error));
    });
}
function tokenFromEnv(options) {
    const explicit = stringOption(options, "token");
    if (explicit) {
        return explicit;
    }
    return process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
}
function stringOption(options, key) {
    const value = options[key];
    return typeof value === "string" ? value : undefined;
}
async function enrichRepoMetadata(owner, repo, metadata, credentials) {
    const rootFiles = await (0, index_1.fetchRepoFiles)(owner, repo, "", credentials).catch(() => []);
    const has = (name) => rootFiles.includes(name);
    const readme = has("README.md")
        ? await (0, index_1.fetchRepoFile)(owner, repo, "README.md", credentials)
        : undefined;
    const docsDir = rootFiles.some((name) => name === "docs" || name === "documentation");
    const workflows = has(".github")
        ? await (0, index_1.fetchRepoFiles)(owner, repo, ".github/workflows", credentials).catch(() => [])
        : [];
    const issueTemplates = has(".github")
        ? await (0, index_1.fetchRepoFiles)(owner, repo, ".github/ISSUE_TEMPLATE", credentials).catch(() => [])
        : [];
    const dotGithubFiles = has(".github")
        ? await (0, index_1.fetchRepoFiles)(owner, repo, ".github", credentials).catch(() => [])
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
        hasPullRequestTemplates: dotGithubFiles.some((name) => name.toLowerCase() === "pull_request_template.md"),
    };
}
function readLocalIssues(dir) {
    const files = (0, node_fs_1.readdirSync)(dir).filter((name) => name.endsWith(".md") || name.endsWith(".json"));
    const issues = [];
    for (const file of files) {
        const content = (0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, file), "utf8");
        issues.push(...(0, parse_1.parseIssuesFromDirectory)(content, file));
    }
    return issues;
}
function readLocalRepoMetadata(dir, name) {
    const has = (path) => (0, node_fs_1.existsSync)((0, node_path_1.join)(dir, path));
    const readme = has("README.md") ? (0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, "README.md"), "utf8") : undefined;
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
function writeJsonFile(path, value) {
    const dir = path.substring(0, Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/")));
    if (dir && !(0, node_fs_1.existsSync)(dir)) {
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
    }
    (0, node_fs_1.writeFileSync)(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
async function main() {
    try {
        const exitCode = await run(process.argv.slice(2));
        process.exitCode = exitCode;
    }
    catch (error) {
        process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 2;
    }
}
if (require.main === module) {
    void main();
}
