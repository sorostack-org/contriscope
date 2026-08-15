"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkScope = checkScope;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
const SCOPE_CREEP_CONJUNCTIONS = [
    "and also",
    "in addition",
    "additionally",
    "as well as",
    "moreover",
    "on top of that",
];
const SIZE_INDICATORS = [
    "estimate",
    "estimated",
    "should take",
    "roughly",
    "approximately",
    "single wave",
    "one sprint",
    "one cycle",
    "within a week",
    "within this wave",
    "~",
    "hours",
    "days",
];
function checkScope(input) {
    const { config, title, body } = input;
    const findings = [];
    const haystack = `${title} ${body}`;
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    const files = (0, text_1.extractFileReferences)(haystack);
    if (files.length === 0) {
        add((0, helpers_1.makeFinding)("scope.no-file-reference", "scope", "warning", "No file or module references", "The issue does not reference any files, modules, or packages, so its scope is hard to estimate.", "Point contributors at the relevant files or modules, e.g. `src/checks/scope.ts` or `@stellar/stellar-sdk`."));
    }
    for (const phrase of config.largeScopePhrases) {
        if (body.toLowerCase().includes(phrase)) {
            add((0, helpers_1.makeFinding)("scope.large", "scope", "warning", `Large-scope wording: "${phrase}"`, `The description uses "${phrase}", which suggests the task is too large for one issue or one wave.`, "Split the work into smaller, independently shippable issues."));
        }
    }
    const conjunctions = (0, text_1.countOccurrences)(body, SCOPE_CREEP_CONJUNCTIONS);
    if (conjunctions >= 3) {
        add((0, helpers_1.makeFinding)("scope.creep", "scope", "warning", "Scope creep indicators detected", `The description chains multiple responsibilities (${conjunctions} scope-creep phrases).`, "Keep one issue to one responsibility; open separate issues for unrelated changes."));
    }
    else if (conjunctions >= 1) {
        add((0, helpers_1.makeFinding)("scope.creep-light", "scope", "info", "Verify the issue has a single responsibility", "The description uses connecting phrases that may bundle multiple changes.", "Confirm each change is necessary for this single issue, otherwise split it."));
    }
    const hasSize = (0, text_1.hasAny)(body, SIZE_INDICATORS);
    if (!hasSize && files.length === 0 && body.trim().length > 600) {
        add((0, helpers_1.makeFinding)("scope.no-size-estimate", "scope", "info", "No size estimate", "The description does not indicate how large the change is expected to be.", 'Add a note such as "Estimated ~3 files" or "Completable within a single wave cycle".'));
    }
    const ambiguity = /\beither\b/i.test(haystack) && /\bor\b/i.test(haystack);
    if (ambiguity) {
        add((0, helpers_1.makeFinding)("scope.ambiguous-choice", "scope", "info", "Possible either/or ambiguity", "The description uses 'either ... or ...', which may leave the approach open-ended.", "Pick one approach, or explicitly state that the contributor may choose and must document it."));
    }
    return { score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
