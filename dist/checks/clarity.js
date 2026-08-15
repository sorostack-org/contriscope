"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkClarity = checkClarity;
exports.countVagueTerms = countVagueTerms;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
const ACTIONABLE_VERBS = [
    "implement",
    "add",
    "create",
    "fix",
    "refactor",
    "build",
    "support",
    "remove",
    "extend",
    "document",
    "write",
    "update",
    "upgrade",
    "migrate",
    "integrate",
    "replace",
    "introduce",
    "enable",
    "adjust",
    "handle",
    "expose",
    "wire up",
    "make",
    "use",
];
function checkClarity(input) {
    const { config, title, body, prose } = input;
    const findings = [];
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    if (!title.trim()) {
        add((0, helpers_1.makeFinding)("clarity.title.missing", "clarity", "error", "Title is missing", "The issue has no title. Contributors should be able to understand the task from the title alone.", 'Use a short, imperative title such as "Add SEP-10 authentication flow".'));
    }
    else {
        if (title.trim().length < config.title.min) {
            add((0, helpers_1.makeFinding)("clarity.title.too-short", "clarity", "error", "Title is too short", `The title is ${title.trim().length} characters; at least ${config.title.min} is recommended.`, "Be more specific, e.g. 'Fix fee estimation for batch payments' instead of 'Fix fees'."));
        }
        if (title.trim().length > config.title.max) {
            add((0, helpers_1.makeFinding)("clarity.title.too-long", "clarity", "warning", "Title is long", `The title is ${title.trim().length} characters; aim for ${config.title.max} or fewer.`, "Move detail into the description and keep the title scannable."));
        }
        if (/\?\s*$/.test(title.trim())) {
            add((0, helpers_1.makeFinding)("clarity.title.question", "clarity", "info", "Title reads as a question", "Titles phrased as questions are less actionable for contributors.", 'Prefer an imperative form: "Add a claim and burn UI" over "Can we add a claim UI?".'));
        }
    }
    if (!body.trim()) {
        add((0, helpers_1.makeFinding)("clarity.body.missing", "clarity", "error", "Description is missing", "The issue has no description. Without context, contributors cannot estimate scope or acceptance criteria.", "Describe the task, why it matters, and what 'done' looks like."));
    }
    else {
        if (body.trim().length < config.minDescriptionLength) {
            add((0, helpers_1.makeFinding)("clarity.body.too-short", "clarity", "error", "Description is too short", `The description is ${body.trim().length} characters; at least ${config.minDescriptionLength} is recommended.`, "Add background, requirements, and acceptance criteria so contributors can work without asking."));
        }
        if ((0, text_1.countWords)(prose) < config.minBodyWords) {
            add((0, helpers_1.makeFinding)("clarity.body.low-word-count", "clarity", "warning", "Description is thin", `The prose body has ${(0, text_1.countWords)(prose)} words; contributors need enough context to scope the work.`, "Expand the description with context, examples, and a definition of done."));
        }
    }
    const titleVague = config.vagueTerms.filter((term) => title.toLowerCase().includes(term));
    const bodyVague = config.vagueTerms.filter((term) => body.toLowerCase().includes(term));
    for (const term of titleVague.slice(0, 2)) {
        add((0, helpers_1.makeFinding)("clarity.vague.title", "clarity", "error", `Vague wording in title: "${term}"`, `The title contains "${term}", which does not describe a concrete deliverable.`, "Name the specific behaviour or artifact the issue should produce."));
    }
    for (const term of bodyVague.slice(0, 3)) {
        add((0, helpers_1.makeFinding)("clarity.vague.body", "clarity", "warning", `Vague wording in description: "${term}"`, `The description uses "${term}" without defining the expected outcome.`, "Replace it with a concrete, testable statement."));
    }
    for (const token of config.placeholderTokens.slice(0, 2)) {
        if (body.toLowerCase().includes(token)) {
            add((0, helpers_1.makeFinding)("clarity.placeholder", "clarity", "warning", `Possible placeholder token: "${token}"`, `The description contains "${token}", which may indicate unfinished content.`, "Replace placeholders with real requirements before publishing the issue."));
        }
    }
    const hasVerb = (0, text_1.hasAny)(`${title} ${body}`, ACTIONABLE_VERBS);
    if (!hasVerb) {
        add((0, helpers_1.makeFinding)("clarity.actionable-verb", "clarity", "warning", "No actionable verb found", "The issue does not describe a concrete action (implement, add, fix, refactor...).", "Start the title with an imperative verb so contributors know what to do."));
    }
    return { score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
function countVagueTerms(body, config) {
    return (0, text_1.countOccurrences)(body, config.vagueTerms);
}
