# Roadmap

ContriScope is developed in the open. Priorities below are indicative; the issue tracker is the
source of truth.

## Done (v0.1)

- Weighted issue scoring across 7 dimensions with actionable findings.
- Stellar-aware checks (SEP refs, network targeting, secret-key detection, Soroban context).
- Drips Wave complexity estimator and readiness checklist.
- GrantFox readiness checklist.
- Repository readiness report (A-F) with per-section breakdown.
- CLI with `check`, `check-repo`, `template`, `init`, `config`, `version`.
- Library API (`scoreIssue`, `assessRepoReadiness`, templates).
- GitHub Action with issue scoring, commenting, and `fail-below` gating.
- Six issue templates and a JSON schema for configuration.
- `check-repo --slug` end-to-end against real repositories, with a GitHub adapter that follows
  `Link`-header pagination, bounds page traversal, and retries secondary rate limits (`429` / `403`
  with `Retry-After`) and transient `5xx` responses.

## Near term

- Publish the action at a stable `v1` tag.
- Publish `contriscope` to npm and set up the release workflow.
- Historical scoring: track issue scores over time to show improvement.

## Later

- A comment-mode report that lists only the blocking findings (less noise on busy issues).
- A config presets catalogue (`wave-lite`, `grantfox-strict`, ...).
- Optional agent-less "auto-apply findings": rewrite an issue body in-place with a suggested
  improved version.
- Support for GitLab issues behind a feature flag.
- Repository-level metrics in the GitHub Action (per-issue badges).
