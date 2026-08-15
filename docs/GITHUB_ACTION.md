# GitHub Action

ContriScope ships as a GitHub Action so repositories can score issues automatically on open and gate
contributions.

## Inputs

| Input          | Description                                                                | Default        |
| -------------- | -------------------------------------------------------------------------- | -------------- |
| `mode`         | `issue` scores one issue; `report` produces a repository readiness report. | `issue`        |
| `issue-number` | Issue to analyse. Defaults to the triggering issue.                        | —              |
| `owner`        | Repository owner. Defaults to the workflow repository.                     | —              |
| `repo`         | Repository name. Defaults to the workflow repository.                      | —              |
| `token`        | Token with read (and comment) permissions.                                 | `GITHUB_TOKEN` |
| `comment`      | Post the report as a comment on the issue (`true`/`false`).                | `false`        |
| `stellar`      | Enable Stellar ecosystem checks.                                           | `true`         |
| `wave`         | Enable Drips Wave scoping checks.                                          | `true`         |
| `config`       | Path to a `.contriscope.json` in the repository.                           | —              |
| `fail-below`   | Fail the step when the score is below this value.                          | —              |

## Outputs

| Output           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `score`          | Issue or repository score (0-100).                    |
| `verdict`        | Issue verdict (`ready` \| `needs-work` \| `blocked`). |
| `grade`          | Repository readiness grade (A-F).                     |
| `wave-level`     | Suggested Wave complexity level.                      |
| `wave-points`    | Suggested Wave points value.                          |
| `wave-score`     | Drips Wave readiness score (0-100).                   |
| `grantfox-score` | GrantFox readiness score (0-100).                     |

## Usage

### Score every newly opened issue

```yaml
name: ContriScope
on:
  issues:
    types: [opened, reopened]

jobs:
  score:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: Sorostack/contriscope@v1
        with:
          mode: issue
          comment: "true"
```

### Gate with a required check

Enforce the issue-quality bar on a repository by failing a check when an issue is below threshold.
Add it to branch protection for the main branch.

```yaml
name: ContriScope gate
on:
  issues:
    types: [opened, reopened]

jobs:
  gate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: Sorostack/contriscope@v1
        with:
          mode: issue
          fail-below: 80
```

### Repository readiness report

```yaml
name: ContriScope report
on:
  workflow_dispatch:
  schedule:
    - cron: "0 6 * * 1"

jobs:
  report:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: Sorostack/contriscope@v1
        with:
          mode: report
```

## Notes

- `mode: issue` reads the triggering issue by default; use `issue-number` to target another one.
- For `mode: report`, the action scores the repository that triggered the workflow (or `owner`/`repo`).
- The built-in `GITHUB_TOKEN` works for reading; grant `issues: write` when `comment` is enabled.
- The action reads a `.contriscope.json` from the repository root automatically; use `config` for a
  different path. Because the action runs in an `actions/checkout` workspace, remember to check out
  the repository (as in the examples above).
