"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkContext = checkContext;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
const BACKGROUND_MARKERS = [
    "because",
    "currently",
    "problem",
    "motivation",
    "goal",
    "background",
    "context",
    "why",
    "this is needed",
    "benefit",
    "the issue",
    "today",
    "purpose",
];
const IMPACT_MARKERS = [
    "users",
    "developers",
    "customers",
    "community",
    "reduces",
    "improves",
    "enables",
    "unblocks",
    "impact",
    "benefit",
    "saves",
];
function checkContext(input) {
    const { title, body } = input;
    const findings = [];
    const haystack = `${title} ${body}`;
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    if (!(0, text_1.hasAny)(haystack, BACKGROUND_MARKERS)) {
        add((0, helpers_1.makeFinding)("context.no-background", "context", "warning", "No background or motivation", "The issue does not explain why the work matters, which makes it harder to prioritise and review.", "Add a short 'Why' or 'Background' paragraph: what is the problem and who is affected."));
    }
    const urls = (0, text_1.extractUrls)(haystack);
    const refs = (0, text_1.extractIssueReferences)(haystack);
    if (urls.length === 0 && refs.length === 0) {
        add((0, helpers_1.makeFinding)("context.no-links", "context", "info", "No links or references", "The issue contains no links to related issues, docs, designs, or discussions.", "Link to related issues (#123), the relevant docs, or a design reference."));
    }
    if (!(0, text_1.hasAny)(haystack, IMPACT_MARKERS)) {
        add((0, helpers_1.makeFinding)("context.no-impact", "context", "info", "Impact not described", "The issue does not describe who benefits or what improves.", 'Mention the outcome, e.g. "This unblocks contributors who need SEP-24 withdrawals".'));
    }
    return { score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
