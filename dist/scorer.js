"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreIssue = scoreIssue;
exports.verdictReason = verdictReason;
exports.computeVerdict = computeVerdict;
exports.buildSummary = buildSummary;
exports.worstFindings = worstFindings;
const config_1 = require("./config");
const checks_1 = require("./checks");
const wave_1 = require("./wave");
function scoreIssue(issue, options = {}) {
    const config = options.config ??
        (options.configOverrides ? (0, config_1.mergeConfig)(options.configOverrides) : config_1.DEFAULT_CONFIG);
    const { dimensions, findings } = (0, checks_1.runChecks)({ config, issue });
    const totalScore = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0));
    const verdict = computeVerdict(totalScore, config);
    const missingEssentials = findings.some((f) => f.id === "clarity.title.missing" || f.id === "clarity.body.missing");
    const finalVerdict = missingEssentials ? "blocked" : verdict;
    const reason = verdictReason(finalVerdict, totalScore, config, missingEssentials);
    const includeWave = options.includeWaveSuggestion ?? config.program.wave;
    const wave = includeWave
        ? (0, wave_1.suggestWaveComplexity)({ config, title: issue.title, body: issue.body })
        : undefined;
    const summary = buildSummary(issue.title, totalScore, finalVerdict, dimensions);
    return {
        issue: { ...issue },
        score: totalScore,
        verdict: finalVerdict,
        reason,
        dimensions,
        findings,
        wave,
        summary,
    };
}
function verdictReason(verdict, score, config, missingEssentials) {
    if (missingEssentials) {
        return "Blocked: the issue is missing a title or description, so contributors cannot scope it.";
    }
    if (verdict === "ready") {
        return `Ready: the score of ${score} meets the ready threshold (${config.verdict.ready}).`;
    }
    if (verdict === "needs-work") {
        return `Needs work: the score of ${score} is below the ready threshold (${config.verdict.ready}).`;
    }
    return `Blocked: the score of ${score} is below the needs-work threshold (${config.verdict.needsWork}).`;
}
function computeVerdict(score, config) {
    if (score >= config.verdict.ready) {
        return "ready";
    }
    if (score >= config.verdict.needsWork) {
        return "needs-work";
    }
    return "blocked";
}
function buildSummary(title, score, verdict, dimensions) {
    const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
    const weakLabel = weakest ? ` Weakest area: ${weakest.label} (${weakest.score}/100).` : "";
    const titleSnippet = title.trim() ? `"${title.trim()}"` : "Untitled issue";
    return `${titleSnippet} scores ${score}/100 (${verdict.replace("-", " ")}).${weakLabel}`;
}
function worstFindings(findings, limit = 5) {
    const severityRank = { error: 3, warning: 2, info: 1 };
    return [...findings]
        .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
        .slice(0, limit);
}
