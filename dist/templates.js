"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_TYPES = void 0;
exports.renderTemplate = renderTemplate;
exports.renderTemplatesConfig = renderTemplatesConfig;
exports.writeIssueTemplates = writeIssueTemplates;
exports.templateTypeFromName = templateTypeFromName;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
exports.TEMPLATE_TYPES = [
    "good-first-issue",
    "soroban",
    "feature",
    "docs",
    "bug",
    "qa",
];
const COMPLEXITY_LABEL = {
    trivial: "complexity: trivial",
    medium: "complexity: medium",
    high: "complexity: high",
};
function renderTemplate(type, options = {}) {
    switch (type) {
        case "good-first-issue":
            return renderGoodFirstIssue(options);
        case "soroban":
            return renderSoroban(options);
        case "feature":
            return renderFeature(options);
        case "docs":
            return renderDocs(options);
        case "bug":
            return renderBug(options);
        case "qa":
            return renderQa(options);
    }
}
function frontmatter(name, about, titlePrefix, labels) {
    const labelsJson = JSON.stringify(labels);
    return [
        "---",
        `name: ${name}`,
        `about: ${about}`,
        `title: ${titlePrefix}`,
        `labels: ${labelsJson}`,
        "---",
    ].join("\n");
}
function sharedSections() {
    return [
        "## Suggested execution",
        "",
        "- [ ] Fork the repository and create a branch",
        "- [ ] Make the changes in a focused, reviewable commit",
        "- [ ] Add or update tests",
        "- [ ] Run the project's checks (lint, typecheck, tests)",
        "- [ ] Open a pull request and link it with `Closes #<issue-number>`",
        "",
        "## Definition of done",
        "",
        "- [ ] The change behaves as described in the acceptance criteria",
        "- [ ] Tests pass and coverage is maintained",
        "- [ ] Documentation (README/docs) is updated if behaviour changed",
        "- [ ] The pull request is scoped to this issue only",
        "",
    ].join("\n");
}
function renderGoodFirstIssue(options) {
    const labels = ["good first issue", COMPLEXITY_LABEL[options.complexity ?? "trivial"]];
    return [
        frontmatter("Good first issue", "A small, well-bounded task for new contributors", "[good-first-issue] ", labels),
        "",
        "## Why",
        "",
        "Explain why this work matters and who benefits. Keep it concise — new contributors should grasp the value quickly.",
        "",
        "## What",
        "",
        "Describe the concrete deliverable. Reference the files or modules involved (e.g. `src/checks/scope.ts`).",
        "",
        "## Scope",
        "",
        "This task should be completable within a single sprint. If it is bigger, split it.",
        "",
        "## Acceptance criteria",
        "",
        "- [ ] (specific, observable outcome 1)",
        "- [ ] (specific, observable outcome 2)",
        "- [ ] Tests cover the new behaviour",
        "",
        "## Context for newcomers",
        "",
        "- [ ] Link the relevant docs or code paths",
        "- [ ] Note the network (Testnet vs Mainnet) if Stellar behaviour is involved",
        "- [ ] Point to how to verify the change locally",
        "",
        sharedSections(),
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "trivial").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderSoroban(options) {
    const labels = ["smart contract", COMPLEXITY_LABEL[options.complexity ?? "medium"]];
    return [
        frontmatter("Soroban contract task", "Implementation work on a Stellar Soroban smart contract", "[soroban] ", labels),
        "",
        "## Why",
        "",
        "Explain the contract behaviour being added or changed and its impact on users (e.g. escrow, payments, splitter).",
        "",
        "## Requirements and context",
        "",
        "- Contract function(s) affected: (list them)",
        "- Target network: **Testnet** / **Mainnet** (delete one)",
        "- Contract ID (if known): `CA...` or 'not yet deployed'",
        "- Storage keys / admin / authority accounts involved: (describe)",
        "",
        "## Scope",
        "",
        "State the functions and files involved (e.g. `contracts/escrow/src/lib.rs`). Keep it to one contract concern.",
        "",
        "## Acceptance criteria",
        "",
        "- [ ] New/updated Soroban contract functions behave as specified",
        "- [ ] Unit tests cover the new logic, including edge cases",
        "- [ ] `cargo test` passes and the contract builds to `wasm32-unknown-unknown`",
        "- [ ] Behaviour is documented (contract doc comment or docs/)",
        "",
        "## Security considerations",
        "",
        "- [ ] No secret keys or live accounts referenced — use placeholders (`G...`, `S...`)",
        "- [ ] Re-entrancy, auth, and panic paths are considered",
        "- [ ] Correct network (Testnet vs Mainnet) is used in examples",
        "",
        sharedSections(),
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "medium").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderFeature(options) {
    const labels = ["enhancement", COMPLEXITY_LABEL[options.complexity ?? "medium"]];
    return [
        frontmatter("Feature request", "A scoped feature implementation for contributors", "[feature] ", labels),
        "",
        "## Why",
        "",
        "Describe the problem this feature solves and who is affected.",
        "",
        "## What",
        "",
        "Describe the intended behaviour in concrete terms. Reference the modules involved.",
        "",
        "## Requirements and context",
        "",
        "- Stack / framework: (e.g. TypeScript, @stellar/stellar-sdk, Next.js)",
        "- Related issues or designs: (#123, link)",
        "- Target network if Stellar behaviour is involved: **Testnet** / **Mainnet**",
        "",
        "## Acceptance criteria",
        "",
        "- [ ] The feature behaves as described",
        "- [ ] Edge cases are handled (list the important ones)",
        "- [ ] Unit and/or integration tests cover the change",
        "- [ ] Docs/README are updated if user-facing",
        "",
        sharedSections(),
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "medium").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderDocs(options) {
    const labels = ["documentation", COMPLEXITY_LABEL[options.complexity ?? "trivial"]];
    return [
        frontmatter("Documentation", "A documentation improvement for contributors and users", "[docs] ", labels),
        "",
        "## Why",
        "",
        "What gap does this documentation fill? Who is the audience?",
        "",
        "## What",
        "",
        "Describe the documentation to be written or updated, with the files involved (e.g. `docs/SCORING.md`).",
        "",
        "## Acceptance criteria",
        "",
        "- [ ] Content is accurate and matches current behaviour",
        "- [ ] Code examples (if any) are runnable and use placeholders for accounts/keys",
        "- [ ] Internal and external links resolve",
        "- [ ] Markdown renders correctly and follows the project style guide",
        "",
        "## Suggested execution",
        "",
        "- [ ] Open a pull request and link it with `Closes #<issue-number>`",
        "- [ ] Request a review from the relevant maintainer",
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "trivial").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderBug(options) {
    const labels = ["bug", COMPLEXITY_LABEL[options.complexity ?? "medium"]];
    return [
        frontmatter("Bug report", "Report a bug so contributors can fix it", "[bug] ", labels),
        "",
        "## Expected behaviour",
        "",
        "What should happen.",
        "",
        "## Actual behaviour",
        "",
        "What happens instead. Include error output where relevant.",
        "",
        "## Steps to reproduce",
        "",
        "1. (step one)",
        "2. (step two)",
        "",
        "## Environment",
        "",
        "- Network: **Testnet** / **Mainnet**",
        "- Package versions / SDK versions involved",
        "- OS / browser where relevant",
        "",
        "## Acceptance criteria",
        "",
        "- [ ] The reported behaviour is fixed",
        "- [ ] A regression test covers the reported scenario",
        "- [ ] Existing tests still pass",
        "",
        "## Suggested execution",
        "",
        "- [ ] Reproduce the issue locally",
        "- [ ] Fix it in a focused commit and link the PR with `Closes #<issue-number>`",
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "medium").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderQa(options) {
    const labels = ["qa", COMPLEXITY_LABEL[options.complexity ?? "trivial"]];
    return [
        frontmatter("QA / test pass", "A test plan for a release, feature, or regression area", "[qa] ", labels),
        "",
        "## Why",
        "",
        "What area needs testing and why now?",
        "",
        "## Scope",
        "",
        "List the features, contracts, or flows to be exercised. Keep the pass bounded.",
        "",
        "## Test plan",
        "",
        "- [ ] (test scenario 1) — expected: (outcome)",
        "- [ ] (test scenario 2) — expected: (outcome)",
        "- [ ] (test scenario 3) — expected: (outcome)",
        "",
        "## Deliverable",
        "",
        "- [ ] A report of results, including steps to reproduce any failures",
        "- [ ] New issues filed for each confirmed bug",
        "- [ ] Confirmation of environment used (network, versions)",
        "",
        "## Suggested execution",
        "",
        "- [ ] Run the test plan and record results",
        "- [ ] File issues for failures and link them in your report",
        "",
        "## Complexity",
        "",
        `Suggested complexity: **${(options.complexity ?? "trivial").toUpperCase()}**. Adjust the complexity label to match the real effort.`,
        "",
    ].join("\n");
}
function renderTemplatesConfig() {
    return [
        "# https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file",
        "blank_issues_enabled: true",
        "contact_links:",
        "  - name: GitHub Discussions",
        "    url: https://github.com/sorostack-org/contriscope/discussions",
        "    about: Ask questions and discuss ideas",
        "",
    ].join("\n");
}
function writeIssueTemplates(directory, options = {}) {
    const targetDir = (0, node_path_1.resolve)(directory);
    (0, node_fs_1.mkdirSync)(targetDir, { recursive: true });
    const written = [];
    for (const type of exports.TEMPLATE_TYPES) {
        const content = renderTemplate(type, {
            complexity: options.complexityByType?.[type],
            waveLabel: options.waveLabel,
        });
        const filename = `${type}.md`;
        const filepath = (0, node_path_1.join)(targetDir, filename);
        (0, node_fs_1.writeFileSync)(filepath, content, "utf8");
        written.push(filepath);
    }
    const configPath = (0, node_path_1.join)(targetDir, "config.yml");
    (0, node_fs_1.writeFileSync)(configPath, renderTemplatesConfig(), "utf8");
    written.push(configPath);
    return written;
}
function templateTypeFromName(name) {
    const normalized = name
        .toLowerCase()
        .replace(/[^a-z-]/g, "")
        .replace(/^issue-/, "");
    if (exports.TEMPLATE_TYPES.includes(normalized)) {
        return normalized;
    }
    return undefined;
}
