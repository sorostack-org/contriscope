"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessRepoReadiness = assessRepoReadiness;
exports.summarizeReadiness = summarizeReadiness;
const config_1 = require("./config");
const scorer_1 = require("./scorer");
const text_1 = require("./text");
const acceptance_1 = require("./checks/acceptance");
function assessRepoReadiness(repo, options = {}) {
    const config = options.config ?? config_1.DEFAULT_CONFIG;
    const issues = options.issues ?? [];
    const assessments = issues.map((issue) => (0, scorer_1.scoreIssue)(issue, { config }));
    const avgIssueScore = average(assessments.map((a) => a.score));
    const avgScope = average(assessments.map((a) => dimensionScore(a, "scope")));
    const sections = buildSections(repo, assessments, issues, config);
    const totalScore = Math.round(sections.reduce((sum, section) => sum + section.score * section.weight, 0));
    const grade = computeGrade(totalScore);
    const findings = sections.flatMap((section) => section.findings);
    const wave = buildProgramReadiness("drips-wave", "Drips Wave", repo, assessments, issues, config);
    const grantfox = buildProgramReadiness("grantfox", "GrantFox", repo, assessments, issues, config);
    return {
        repo,
        score: totalScore,
        grade,
        sections,
        findings,
        programs: { wave, grantfox },
        issuesScored: assessments.length,
        issuesTotal: issues.length,
    };
}
function buildSections(repo, assessments, issues, config) {
    return [
        scoreSection("documentation", "Documentation", 0.2, documentationItems(repo)),
        scoreSection("issue-quality", "Issue quality", 0.3, issueQualityItems(assessments, issues)),
        scoreSection("activity", "Activity & maintenance", 0.15, activityItems(repo)),
        scoreSection("onboarding", "Contributor onboarding", 0.2, onboardingItems(repo, issues, config)),
        scoreSection("ecosystem", "Ecosystem signals", 0.15, ecosystemItems(repo, issues, config)),
    ];
}
function scoreSection(id, label, weight, items) {
    const metCount = items.filter((item) => item.met).length;
    const score = items.length > 0 ? Math.round((metCount / items.length) * 100) : 0;
    const findings = unmetFindings(id, items);
    return { id, label, score, weight, findings };
}
function unmetFindings(id, items) {
    return items
        .filter((item) => !item.met)
        .slice(0, 4)
        .map((item) => ({
        id: `${id}.${item.id}`,
        dimension: "clarity",
        severity: "warning",
        title: item.label,
        message: item.detail,
        suggestion: undefined,
    }));
}
function documentationItems(repo) {
    return [
        {
            id: "readme",
            label: "README present and substantial",
            met: Boolean(repo.hasREADME && (repo.readmeLength ?? 0) >= 400),
            detail: repo.hasREADME
                ? `README present (${repo.readmeLength ?? "?"} characters).`
                : "A substantial README is required for contributors to understand the project.",
        },
        {
            id: "contributing",
            label: "CONTRIBUTING guide present",
            met: Boolean(repo.hasContributing),
            detail: repo.hasContributing
                ? "CONTRIBUTING guide present."
                : "Add a CONTRIBUTING guide so contributors know how to get started.",
        },
        {
            id: "license",
            label: "Open-source license",
            met: Boolean(repo.hasLicense),
            detail: repo.hasLicense
                ? "LICENSE file present."
                : "Add an open-source license (e.g. MIT) so contributions are legally usable.",
        },
        {
            id: "docs",
            label: "Documentation available",
            met: Boolean(repo.hasDocs),
            detail: repo.hasDocs
                ? "A docs folder or docs site is present."
                : "Provide documentation (architecture, API, setup) beyond the README.",
        },
        {
            id: "security",
            label: "Security policy",
            met: Boolean(repo.hasSecurity),
            detail: repo.hasSecurity
                ? "SECURITY policy present."
                : "Add a SECURITY.md with a vulnerability reporting path.",
        },
    ];
}
function issueQualityItems(assessments, issues) {
    const withAcceptance = assessments.filter((a) => (0, text_1.hasSection)(a.issue.body, acceptance_1.ACCEPTANCE_HEADINGS)).length;
    const labeledIssues = issues.filter((i) => i.labels !== undefined);
    const labeledRatio = labeledIssues.length > 0
        ? labeledIssues.filter((i) => (i.labels?.length ?? 0) > 0).length / labeledIssues.length
        : undefined;
    const withFileRefs = assessments.filter((a) => (0, text_1.extractFileReferences)(a.issue.body).length > 0).length;
    return [
        {
            id: "avg-score",
            label: "Average issue score is good",
            met: assessments.length > 0 && average(assessments.map((a) => a.score)) >= 70,
            detail: assessments.length > 0
                ? `Average issue score: ${Math.round(average(assessments.map((a) => a.score)))}/100.`
                : "No issues provided to assess.",
        },
        {
            id: "acceptance-criteria",
            label: "Issues define acceptance criteria",
            met: assessments.length > 0 && withAcceptance / assessments.length >= 0.5,
            detail: assessments.length > 0
                ? `${withAcceptance}/${assessments.length} issues define acceptance criteria.`
                : "No issues to check.",
        },
        {
            id: "labels",
            label: "Issues use labels",
            met: labeledRatio === undefined || labeledRatio >= 0.5,
            detail: labeledRatio === undefined
                ? "No label data available."
                : `${Math.round(labeledRatio * 100)}% of issues carry labels.`,
        },
        {
            id: "file-refs",
            label: "Issues reference files or modules",
            met: assessments.length > 0 && withFileRefs / assessments.length >= 0.5,
            detail: assessments.length > 0
                ? `${withFileRefs}/${assessments.length} issues reference files or modules.`
                : "No issues to check.",
        },
        {
            id: "open-issues",
            label: "There are scoped issues to apply to",
            met: assessments.length > 0,
            detail: assessments.length > 0
                ? `${assessments.length} issue(s) analysed.`
                : "No open issues found for contributors.",
        },
    ];
}
function activityItems(repo) {
    const total = (repo.openIssues ?? 0) + (repo.closedIssues ?? 0);
    const resolvedRatio = total > 0 ? (repo.closedIssues ?? 0) / total : 0;
    return [
        {
            id: "activity",
            label: "Repository has issue activity",
            met: total > 0,
            detail: total > 0
                ? `${repo.openIssues ?? 0} open, ${repo.closedIssues ?? 0} closed.`
                : "No issue activity.",
        },
        {
            id: "resolved",
            label: "Issues are being resolved",
            met: total > 0 && resolvedRatio >= 0.4,
            detail: total > 0
                ? `${Math.round(resolvedRatio * 100)}% of issues resolved.`
                : "Cannot determine resolution ratio.",
        },
        {
            id: "description",
            label: "Repository description present",
            met: Boolean(repo.description),
            detail: repo.description ? "Description present." : "Add a short repository description.",
        },
    ];
}
function onboardingItems(repo, issues, config) {
    const goodFirst = issues.filter((issue) => (issue.labels ?? []).some((label) => label.toLowerCase() === config.labels.goodFirstIssue)).length;
    return [
        {
            id: "coc",
            label: "Code of Conduct",
            met: Boolean(repo.hasCodeOfConduct),
            detail: repo.hasCodeOfConduct
                ? "CODE_OF_CONDUCT present."
                : "Add a code of conduct to foster a welcoming community.",
        },
        {
            id: "ci",
            label: "CI is configured",
            met: Boolean(repo.hasCi),
            detail: repo.hasCi
                ? "CI workflows present."
                : "Add CI so contributors know their PRs will be checked.",
        },
        {
            id: "issue-templates",
            label: "Issue templates",
            met: Boolean(repo.hasIssueTemplates),
            detail: repo.hasIssueTemplates
                ? "Issue templates present."
                : "Add issue templates to capture context and acceptance criteria.",
        },
        {
            id: "pr-templates",
            label: "Pull request templates",
            met: Boolean(repo.hasPullRequestTemplates),
            detail: repo.hasPullRequestTemplates
                ? "PR templates present."
                : "Add a PR template (including 'Closes #issue').",
        },
        {
            id: "good-first",
            label: "Beginner-friendly issues",
            met: goodFirst >= config.repo.goodFirstIssueTarget,
            detail: `${goodFirst} good-first-issue(s) found (target: ${config.repo.goodFirstIssueTarget}).`,
        },
    ];
}
function ecosystemItems(repo, issues, config) {
    const description = (repo.description ?? "").toLowerCase();
    const name = repo.name.toLowerCase();
    const isStellarProject = /stellar|soroban|xlm|anchor/.test(`${description} ${name}`);
    const waveLabelUsed = issues.some((issue) => (issue.labels ?? []).some((label) => label.toLowerCase() === config.labels.wave.toLowerCase()));
    const complexityLabelled = issues.some((issue) => (issue.labels ?? []).some((label) => label.toLowerCase().startsWith("complexity") ||
        ["trivial", "medium", "high"].includes(label.toLowerCase())));
    return [
        {
            id: "stellar",
            label: "Stellar ecosystem project",
            met: isStellarProject,
            detail: isStellarProject
                ? "Project signals align with the Stellar ecosystem."
                : "No Stellar signal found in the description or name.",
        },
        {
            id: "wave-label",
            label: "Wave label in use",
            met: waveLabelUsed,
            detail: waveLabelUsed
                ? `Issues use the "${config.labels.wave}" label.`
                : `No issue uses the "${config.labels.wave}" label yet.`,
        },
        {
            id: "complexity-label",
            label: "Complexity tags in use",
            met: complexityLabelled,
            detail: complexityLabelled
                ? "Issues carry complexity tags."
                : "No complexity tags found on issues.",
        },
        {
            id: "issues",
            label: "Issue data available",
            met: issues.length > 0,
            detail: issues.length > 0 ? `${issues.length} issue(s) analysed.` : "No issues provided.",
        },
    ];
}
function buildProgramReadiness(name, label, repo, assessments, issues, config) {
    const items = name === "drips-wave"
        ? waveItems(repo, assessments, config)
        : grantfoxItems(repo, assessments, issues, config);
    const metCount = items.filter((item) => item.met).length;
    const score = items.length > 0 ? Math.round((metCount / items.length) * 100) : 0;
    const verdict = score >= config.verdict.ready
        ? "ready"
        : score >= config.verdict.needsWork
            ? "needs-work"
            : "blocked";
    return { name, label, score, verdict, checklist: items };
}
function waveItems(repo, assessments, config) {
    const withSignals = assessments.filter((a) => (a.wave?.signals.length ?? 0) > 0).length;
    const avgScope = average(assessments.map((a) => dimensionScore(a, "scope")));
    return [
        {
            id: "open-issues",
            label: "There are issues to contribute to",
            met: assessments.length > 0,
            detail: assessments.length > 0
                ? `${assessments.length} issue(s) available.`
                : "No issues available.",
        },
        {
            id: "single-wave-scope",
            label: "Issues are scoped for a single wave",
            met: assessments.length === 0 || avgScope >= 70,
            detail: `Average scope score: ${Math.round(avgScope)}/100.`,
        },
        {
            id: "complexity-signals",
            label: "Issues carry complexity signals",
            met: assessments.length > 0 && withSignals / assessments.length >= 0.5,
            detail: assessments.length > 0
                ? `${withSignals}/${assessments.length} issues produced complexity signals.`
                : "No issues to analyse.",
        },
        {
            id: "onboarding",
            label: "Contributor onboarding is documented",
            met: Boolean(repo.hasREADME && repo.hasContributing),
            detail: `${repo.hasREADME ? "README ✓" : "README ✗"} · ${repo.hasContributing ? "CONTRIBUTING ✓" : "CONTRIBUTING ✗"}.`,
        },
        {
            id: "labels",
            label: "Wave complexity tagging is possible",
            met: Boolean(config.program.wave),
            detail: "Wave program checks are enabled.",
        },
    ];
}
function grantfoxItems(repo, assessments, issues, config) {
    const avgScore = average(assessments.map((a) => a.score));
    const avgScope = average(assessments.map((a) => dimensionScore(a, "scope")));
    return [
        {
            id: "enabled",
            label: "GrantFox program checks are enabled",
            met: Boolean(config.program.grantfox),
            detail: config.program.grantfox
                ? "GrantFox program checks are enabled."
                : "GrantFox checks are disabled via configuration.",
        },
        {
            id: "readme",
            label: "README present",
            met: Boolean(repo.hasREADME),
            detail: repo.hasREADME ? "README present." : "README missing.",
        },
        {
            id: "contributing",
            label: "CONTRIBUTING guide present",
            met: Boolean(repo.hasContributing),
            detail: repo.hasContributing ? "CONTRIBUTING present." : "CONTRIBUTING missing.",
        },
        {
            id: "issue-quality",
            label: "Issue quality is high",
            met: assessments.length === 0 || avgScore >= 70,
            detail: `Average issue score: ${Math.round(avgScore)}/100.`,
        },
        {
            id: "scope",
            label: "Issues are well scoped",
            met: assessments.length === 0 || avgScope >= 70,
            detail: `Average scope score: ${Math.round(avgScope)}/100.`,
        },
        {
            id: "activity",
            label: "Repository is active",
            met: (repo.openIssues ?? 0) + (repo.closedIssues ?? 0) > 0,
            detail: `${repo.openIssues ?? 0} open, ${repo.closedIssues ?? 0} closed issues.`,
        },
        {
            id: "templates",
            label: "Issue templates exist",
            met: Boolean(repo.hasIssueTemplates),
            detail: repo.hasIssueTemplates ? "Issue templates present." : "Issue templates missing.",
        },
    ];
}
function dimensionScore(assessment, id) {
    const dimension = assessment.dimensions.find((d) => d.id === id);
    return dimension ? dimension.score : 0;
}
function average(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function computeGrade(score) {
    if (score >= 90) {
        return "A";
    }
    if (score >= 75) {
        return "B";
    }
    if (score >= 60) {
        return "C";
    }
    if (score >= 40) {
        return "D";
    }
    return "F";
}
function summarizeReadiness(report) {
    const top = (0, scorer_1.worstFindings)(report.findings, 3);
    const topLine = top.map((f) => f.title).join("; ");
    return `${report.repo.name} readiness ${report.score}/100 (${report.grade}). ${report.issuesScored}/${report.issuesTotal} issues scored.${topLine ? ` Priority: ${topLine}.` : ""}`;
}
