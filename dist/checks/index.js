"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runChecks = runChecks;
const text_1 = require("../text");
const clarity_1 = require("./clarity");
const scope_1 = require("./scope");
const acceptance_1 = require("./acceptance");
const context_1 = require("./context");
const guidance_1 = require("./guidance");
const metadata_1 = require("./metadata");
const stellar_1 = require("./stellar");
const DIMENSION_LABELS = {
    clarity: "Clarity",
    scope: "Scope",
    acceptance: "Acceptance criteria",
    context: "Context & impact",
    guidance: "Technical guidance",
    metadata: "Labels & metadata",
    stellar: "Stellar ecosystem",
};
function runChecks({ config, issue }) {
    const prose = (0, text_1.stripCodeBlocks)(issue.body);
    const clarity = (0, clarity_1.checkClarity)({ config, title: issue.title, body: issue.body, prose });
    const scope = (0, scope_1.checkScope)({ config, title: issue.title, body: issue.body });
    const acceptance = (0, acceptance_1.checkAcceptance)({ config, body: issue.body });
    const context = (0, context_1.checkContext)({ title: issue.title, body: issue.body });
    const guidance = (0, guidance_1.checkGuidance)({ title: issue.title, body: issue.body });
    const metadata = (0, metadata_1.checkMetadata)({ config, labels: issue.labels });
    const stellar = (0, stellar_1.checkStellar)({ config, title: issue.title, body: issue.body });
    const raw = {
        clarity: {
            label: DIMENSION_LABELS.clarity,
            score: clarity.score,
            weight: config.weights.clarity,
            findings: clarity.findings,
        },
        scope: {
            label: DIMENSION_LABELS.scope,
            score: scope.score,
            weight: config.weights.scope,
            findings: scope.findings,
        },
        acceptance: {
            label: DIMENSION_LABELS.acceptance,
            score: acceptance.score,
            weight: config.weights.acceptance,
            findings: acceptance.findings,
        },
        context: {
            label: DIMENSION_LABELS.context,
            score: context.score,
            weight: config.weights.context,
            findings: context.findings,
        },
        guidance: {
            label: DIMENSION_LABELS.guidance,
            score: guidance.score,
            weight: config.weights.guidance,
            findings: guidance.findings,
        },
        metadata: {
            label: DIMENSION_LABELS.metadata,
            score: metadata.score,
            weight: config.weights.metadata,
            findings: metadata.findings,
        },
    };
    if (stellar.active) {
        raw.stellar = {
            label: DIMENSION_LABELS.stellar,
            score: stellar.score,
            weight: config.weights.stellar,
            findings: stellar.findings,
        };
    }
    const includedIds = Object.keys(raw);
    const weightSum = includedIds.reduce((sum, id) => sum + (raw[id]?.weight ?? 0), 0);
    const dimensions = includedIds.map((id) => {
        const dimension = raw[id];
        return {
            id,
            label: dimension.label,
            score: dimension.score,
            weight: weightSum > 0 ? Number((dimension.weight / weightSum).toFixed(4)) : 0,
            findings: dimension.findings,
        };
    });
    const findings = dimensions.flatMap((dimension) => dimension.findings);
    return { dimensions, findings };
}
