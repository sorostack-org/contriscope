# ContriScope

Score GitHub issues and repositories for **funded open-source contribution readiness** on the
Stellar ecosystem — for **Drips Wave** and **GrantFox**.

ContriScope turns a vague issue ("improve stuff") into a checklist of concrete improvements so
maintainers can confidently list a task as a funded contribution. It answers two questions:

1. **Is this issue contributor-ready?** — a weighted 0-100 score across clarity, scope, acceptance
   criteria, context, guidance, metadata, and Stellar-specific checks, with a verdict of `ready`,
   `needs-work`, or `blocked`.
2. **Is this repository ready for a funded program?** — an A-F readiness report with dedicated
   checklists for Drips Wave and GrantFox.

Zero runtime dependencies. Works as a CLI, a JavaScript library, and a GitHub Action.

## Why

Funded contribution programs reject projects for a handful of recurring reasons:

- Issues are vague, poorly scoped, or do not define what "done" means.
- Missing onboarding (README, CONTRIBUTING, templates, labels).
- Low or unclear activity.

These are all fixable before a maintainer ever submits an application. ContriScope makes the gaps
visible automatically and keeps them fixed as the project evolves.

## Features

- **Issue scoring** — 7 weighted dimensions, configurable thresholds, actionable findings per
  dimension with a severity level and a concrete suggestion.
- **Stellar-aware checks** — SEP references, network targeting (Testnet/Mainnet), Friendbot, Soroban
  context, asset/issuer context, and detection of leaked Stellar secret keys (S...) that must never
  appear in an issue.
- **Drips Wave support** — a complexity estimator (Trivial 100 / Medium 150 / High 200 points),
  recognition of the `Stellar Wave` label and `complexity: *` labels, and a Wave readiness checklist.
- **GrantFox support** — a readiness checklist mirroring the criteria maintainers are evaluated on.
- **Repository readiness report** — documentation, issue quality, activity, onboarding, and ecosystem
  signals in one A-F grade with per-section scores.
- **Issue templates** — 6 templates (good-first-issue, soroban, feature, docs, bug, qa) that enforce
  the structure ContriScope rewards.
- **GitHub Action** — score issues on open, comment the report, and gate merges with a `fail-below`
  threshold.
- **Zero runtime dependencies** — the published package depends only on the Node standard library.

## Install

```sh
npm install -g contriscope
```

or run it without installing:

```sh
npx contriscope --help
```

Requires Node.js >= 18.18.

## Quick start

Score an issue file (Markdown or JSON):

```sh
contriscope check path/to/issue.md
contriscope check path/to/issue.md --format json
```

Score a repository's issue list from GitHub:

```sh
contriscope check-repo --slug sorostack-org/contriscope
```

Analyse a local directory of issue files:

```sh
contriscope check-repo --path ./issues
```

Generate issue templates for your repository:

```sh
contriscope template all --write --dir .github/ISSUE_TEMPLATE
```

Scaffold a config file and templates:

```sh
contriscope init
```

Show the effective configuration (with your `.contriscope.json`, if present):

```sh
contriscope config
```

## Example output

```
ContriScope report
🟢 97/100 · ✅ ready

"Add SEP-10 authentication flow to the TypeScript client" scores 97/100 (ready). Weakest area: Clarity (88/100).

Wave complexity (suggested): HIGH · 200 points · confidence 1

  Clarity                 88/100
  Scope                  100/100
  Acceptance criteria    100/100
  Context & impact       100/100
  Technical guidance     100/100
  Labels & metadata      100/100
  Stellar ecosystem      100/100

[WARNING] clarity: Vague wording in description: "improve"
[INFO] metadata: Wave label not applied
```

## CLI reference

| Command           | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `check <file>`    | Score a single issue. Use `-` to read from stdin.                                                     |
| `check-repo`      | Repository readiness report. Needs `--slug owner/repo` (or `--owner` + `--repo`) or `--path <dir>`.   |
| `template <type>` | Print an issue template. Types: `good-first-issue`, `soroban`, `feature`, `docs`, `bug`, `qa`, `all`. |
| `init`            | Scaffold `.contriscope.json` and issue templates.                                                     |
| `config`          | Print the effective configuration as JSON.                                                            |
| `version`         | Print the version.                                                                                    |
| `help`            | Show usage.                                                                                           |

Common options:

- `--format text|markdown|json` — output format (default `text`).
- `--config <file>` — path to a `.contriscope.json` config file.
- `--fail-below <score>` — exit `1` when the score is below this value.
- `--no-stellar` / `--no-wave` / `--no-grantfox` — disable program checks.
- `--token <gh>` — GitHub token for `check-repo --slug`.

Exit codes: `0` success (or below threshold not hit), `1` below threshold / not ready,
`2` usage or I/O error.

## GitHub Action

```yaml
on:
  issues:
    types: [opened, reopened]

jobs:
  contriscope:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: sorostack-org/contriscope@v1
        with:
          mode: issue
          comment: "true"
```

See [docs/GITHUB_ACTION.md](docs/GITHUB_ACTION.md) for all inputs, outputs, and gating examples.

## Configuration

ContriScope works out of the box with sensible defaults, tuned against the scoring rules of Drips
Wave and the feedback patterns GrantFox publishes. To override, create `.contriscope.json` in your
repository root and pass `--config .contriscope.json` (or set the `config` input on the action).

```json
{
  "verdict": {
    "ready": 85
  },
  "weights": {
    "clarity": 0.3
  },
  "labels": {
    "wave": "Stellar Wave",
    "complexity": {
      "trivial": "complexity: trivial",
      "medium": "complexity: medium",
      "high": "complexity: high"
    }
  }
}
```

Partial configs are deep-merged over the defaults. The full schema is available at
[contriscope.schema.json](contriscope.schema.json).

## As a library

```ts
import { scoreIssue, DEFAULT_CONFIG } from "contriscope";

const assessment = scoreIssue(
  {
    title: "Add SEP-10 auth flow",
    body: "Implement SEP-10 authentication for the TypeScript client using @stellar/stellar-sdk. ...",
    labels: ["enhancement", "complexity: high"],
  },
  { config: DEFAULT_CONFIG },
);

console.log(assessment.score); // 97
console.log(assessment.verdict); // "ready"
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — project layout and data flow.
- [Scoring model](docs/SCORING.md) — dimensions, weights, verdicts.
- [Drips Wave](docs/WAVE.md) — complexity estimation and the Wave checklist.
- [GrantFox](docs/GRANTFOX.md) — what GrantFox looks for and how ContriScope reflects it.
- [GitHub Action](docs/GITHUB_ACTION.md) — full action reference.

## Example issues

- [`examples/good-issue.md`](examples/good-issue.md) — a well-scoped issue that scores `ready`.
- [`examples/bad-issue.md`](examples/bad-issue.md) — the same task written vaguely, scoring `needs-work`.

## Development

```sh
npm install
npm run ci        # typecheck + lint + format:check + test + build
npm run test:watch
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

## Funding

ContriScope itself is registered on Drips and accepts donations on any Stellar-friendly chain. See
[FUNDING.json](FUNDING.json) and [.github/FUNDING.yml](.github/FUNDING.yml).
