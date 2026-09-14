# Drips Wave

Drips Wave is a funding program that pays contributors to resolve GitHub issues in approved
repositories, coordinated on-chain by Drips. Maintainers scope issues, contributors pick them up, and
rewards are distributed on the Stellar network.

> ContriScope is not affiliated with or endorsed by Drips or the Wave program. The references below
> reflect public program documentation and are provided to help maintainers scope issues the way the
> program expects.

## The complexity model

Wave rewards are sized by complexity. The program's published guidance maps complexity to points:

| Level   | Points |
| ------- | -----: |
| Trivial |    100 |
| Medium  |    150 |
| High    |    200 |

ContriScope mirrors this in `wave.points` in the config.

## How ContriScope helps

### 1. Complexity estimation

`suggestWaveComplexity` scans the title and body for complexity signals and returns a suggested
level, points, and a confidence score:

- **High signals** — refactor, migration, integration, architecture, cross-cutting, breaking change,
  performance, security, multisig, indexer, realtime, protocol, Soroban smart contract, token
  standard, governance, sponsored/escrow, federation, SDK integration.
- **Medium signals** — feature, implement, endpoint/API, UI/component, state management, form,
  validation, pagination/filter/sort, auth, middleware, dashboard, CLI, database/schema, webhook.
- **Trivial signals** — typo, dependency bump/update, minor/one-line fix, rename, clarification,
  documentation/copy/grammar, error message, broken link, formatting, lint.

The suggestion is a starting point; the maintainer remains responsible for the final complexity
tag. Low confidence means the issue has no strong signals and should be reviewed before assigning
points.

### 2. Complexity labels

Wave-compatible repositories tag each issue with a complexity label. ContriScope recognizes (and can
be configured for):

- `complexity: trivial`
- `complexity: medium`
- `complexity: high`

An issue without any complexity label is flagged in the metadata dimension.

### 3. The Wave label

Included Wave issues carry the `Stellar Wave` label. ContriScope flags issues that omit it, and the
repository checklist reports whether any issue uses it yet.

### 4. Wave readiness checklist

The repository report includes a Wave checklist:

- There are issues to contribute to.
- Issues are scoped for a single wave.
- Issues carry complexity signals.
- Contributor onboarding is documented.
- Wave complexity tagging is possible (labels/config enabled).

## The issue quality bar

The program publishes guidance for writing contribution-ready issues ("Creating Meaningful Issues").
The recurring requirements map directly to ContriScope dimensions:

- A specific, outcome-oriented title (Clarity).
- A bounded scope with file/module references (Scope).
- Acceptance criteria defining done (Acceptance).
- Context on why the work matters (Context).
- Hints on where to look and how to validate (Guidance).
- A complexity tag (Metadata).

See [SCORING.md](SCORING.md) for the exact checks.

## Running the Wave report

```sh
contriscope check-repo --slug sorostack-org/contriscope
```

The `programs.wave` section of the JSON output lists each checklist item with `met: true/false` and a
detail line.
