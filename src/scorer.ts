import { DEFAULT_CONFIG, mergeConfig, type ContriscopeConfig, type DeepPartial } from "./config";
import { runChecks } from "./checks";
import { suggestWaveComplexity } from "./wave";
import type { DimensionScore, Finding, Issue, IssueAssessment, Verdict } from "./types";

export interface ScoreIssueOptions {
  config?: ContriscopeConfig;
  configOverrides?: DeepPartial<ContriscopeConfig>;
  includeWaveSuggestion?: boolean;
}

export function scoreIssue(issue: Issue, options: ScoreIssueOptions = {}): IssueAssessment {
  const config =
    options.config ??
    (options.configOverrides ? mergeConfig(options.configOverrides) : DEFAULT_CONFIG);

  const { dimensions, findings } = runChecks({ config, issue });

  const totalScore = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0),
  );
  const verdict = computeVerdict(totalScore, config);

  const missingEssentials = findings.some(
    (f) => f.id === "clarity.title.missing" || f.id === "clarity.body.missing",
  );
  const finalVerdict: Verdict = missingEssentials ? "blocked" : verdict;
  const reason = verdictReason(finalVerdict, totalScore, config, missingEssentials);

  const includeWave = options.includeWaveSuggestion ?? config.program.wave;
  const wave = includeWave
    ? suggestWaveComplexity({ config, title: issue.title, body: issue.body })
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

export function verdictReason(
  verdict: Verdict,
  score: number,
  config: ContriscopeConfig,
  missingEssentials: boolean,
): string {
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

export function computeVerdict(score: number, config: ContriscopeConfig): Verdict {
  if (score >= config.verdict.ready) {
    return "ready";
  }
  if (score >= config.verdict.needsWork) {
    return "needs-work";
  }
  return "blocked";
}

export function buildSummary(
  title: string,
  score: number,
  verdict: Verdict,
  dimensions: DimensionScore[],
): string {
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const weakLabel = weakest ? ` Weakest area: ${weakest.label} (${weakest.score}/100).` : "";
  const titleSnippet = title.trim() ? `"${title.trim()}"` : "Untitled issue";
  return `${titleSnippet} scores ${score}/100 (${verdict.replace("-", " ")}).${weakLabel}`;
}

export function worstFindings(findings: Finding[], limit = 5): Finding[] {
  const severityRank: Record<Finding["severity"], number> = { error: 3, warning: 2, info: 1 };
  return [...findings]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    .slice(0, limit);
}
