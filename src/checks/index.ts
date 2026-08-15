import type { ContriscopeConfig } from "../config";
import type { DimensionId, DimensionScore, Finding, Issue } from "../types";
import { stripCodeBlocks } from "../text";
import { checkClarity } from "./clarity";
import { checkScope } from "./scope";
import { checkAcceptance } from "./acceptance";
import { checkContext } from "./context";
import { checkGuidance } from "./guidance";
import { checkMetadata } from "./metadata";
import { checkStellar } from "./stellar";

const DIMENSION_LABELS: Record<DimensionId, string> = {
  clarity: "Clarity",
  scope: "Scope",
  acceptance: "Acceptance criteria",
  context: "Context & impact",
  guidance: "Technical guidance",
  metadata: "Labels & metadata",
  stellar: "Stellar ecosystem",
};

export interface RunChecksOptions {
  config: ContriscopeConfig;
  issue: Issue;
}

export interface RunChecksResult {
  dimensions: DimensionScore[];
  findings: Finding[];
}

interface RawDimension {
  label: string;
  score: number;
  weight: number;
  findings: Finding[];
}

export function runChecks({ config, issue }: RunChecksOptions): RunChecksResult {
  const prose = stripCodeBlocks(issue.body);

  const clarity = checkClarity({ config, title: issue.title, body: issue.body, prose });
  const scope = checkScope({ config, title: issue.title, body: issue.body });
  const acceptance = checkAcceptance({ config, body: issue.body });
  const context = checkContext({ title: issue.title, body: issue.body });
  const guidance = checkGuidance({ title: issue.title, body: issue.body });
  const metadata = checkMetadata({ config, labels: issue.labels });
  const stellar = checkStellar({ config, title: issue.title, body: issue.body });

  const raw: Partial<Record<DimensionId, RawDimension>> = {
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

  const includedIds = Object.keys(raw) as DimensionId[];
  const weightSum = includedIds.reduce((sum, id) => sum + (raw[id]?.weight ?? 0), 0);

  const dimensions: DimensionScore[] = includedIds.map((id) => {
    const dimension = raw[id] as RawDimension;
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
