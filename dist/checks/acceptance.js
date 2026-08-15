"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCEPTANCE_HEADINGS = void 0;
exports.checkAcceptance = checkAcceptance;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
exports.ACCEPTANCE_HEADINGS = [
    "acceptance criteria",
    "acceptance cri",
    "definition of done",
    "done when",
    "what done looks like",
    "done criteria",
    "requirements and context",
    "checklist",
];
const TEST_TERMS = ["test", "coverage", "verify", "validated", "spec"];
function checkAcceptance(input) {
    const { body } = input;
    const findings = [];
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    const hasAcceptance = (0, text_1.hasSection)(body, exports.ACCEPTANCE_HEADINGS);
    if (!hasAcceptance) {
        add((0, helpers_1.makeFinding)("acceptance.criteria-missing", "acceptance", "error", "No acceptance criteria", "The issue does not define what 'done' means. Contributors cannot know when their PR is complete.", "Add an 'Acceptance criteria' section with concrete, verifiable outcomes."));
    }
    else {
        if (!(0, text_1.containsCheckboxes)(body)) {
            add((0, helpers_1.makeFinding)("acceptance.no-checkboxes", "acceptance", "warning", "Acceptance criteria without checkboxes", "The issue mentions acceptance criteria but does not use a checkbox list.", "Use a `- [ ]` checklist so both contributors and reviewers can track completion."));
        }
    }
    const files = (0, text_1.extractFileReferences)(body);
    const looksCodeHeavy = files.length > 0;
    const hasTestMention = (0, text_1.hasAny)(body, TEST_TERMS);
    if (!hasTestMention) {
        add((0, helpers_1.makeFinding)("acceptance.no-tests", "acceptance", looksCodeHeavy ? "warning" : "info", "Testing expectations not stated", "The issue does not mention how the change should be tested or verified.", "State the expected verification, e.g. 'Add unit tests and ensure `npm test` passes'."));
    }
    const closesReference = /closes\s+#\d+/i.test(body) || /fixes\s+#\d+/i.test(body);
    if (!closesReference) {
        add((0, helpers_1.makeFinding)("acceptance.no-close-reference", "acceptance", "info", "PR-to-issue linkage not specified", "Funded programs require the pull request to reference the issue it resolves.", "Tell contributors to include `Closes #<issue-number>` in the PR description."));
    }
    return { score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
