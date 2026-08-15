import { DEFAULT_CONFIG, mergeConfig, type ContriscopeConfig, type DeepPartial } from "./config";
import { runChecks } from "./checks";
import { suggestWaveComplexity } from "./wave";
import type { DimensionScore, Issue, IssueAssessment, Verdict } from "./types";

export interface ScoreIssueOptions {
  config?: ContriscopeConfig;
  configOverrides?: DeepPartial<ContriscopeConfig>;
  includeWaveSuggestion?: boolean;
}

export function scoreIssue(issue: Issue, options: ScoreIssueOptions = {}): IssueAssessment {
  const config = options.config ?? (options.configOverrides ? mergeConfig(options.configOverrides) : DEFAULT_CONFIG);

  const { dimensions, findings } = runChecks({ config, issue });

  const totalScore = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0));
  const verdict = computeVerdict(totalScore, config);

  const includeWave = options.includeWaveSuggestion ?? config.program.wave;
  const wave = includeWave
    ? suggestWaveComplexity({ config, title: issue.title, body: issue.body })
    : undefined;

  const summary = buildSummary(issue.title, totalScore, verdict, dimensions);

  return {
    issue: { ...issue },
    score: totalScore,
    verdict,
    dimensions,
    findings,
    wave,
    summary,
  };
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

export function computeVerdict(score: number, config: ContriscopeConfig): Verdict {
  if (score >= config.verdict.ready) {
    return "ready";
  }
  if (score >= config.verdict.needsWork) {
    return "needs-work";
  }
  return "blocked";
}

export function worstFindings(findings: IssueAssessment["findings"], limit = 5): IssueAssessment["findings"] {
  const severityRank: Record<IssueAssessment["findings"][number]["severity"], number> = {
    error: 3,
    warning: 2,
    info: 1,
  };
  return [...findings]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    .slice(0, limit);
}

export function dimensionScore(assessment: IssueAssessment, id: DimensionScore["id"]): number {
  const dimension = assessment.dimensions.find((d) => d.id === id);
  return dimension ? dimension.score : 0;
}
