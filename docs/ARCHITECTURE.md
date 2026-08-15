# Architecture

ContriScope is a zero-runtime-dependency TypeScript project. It compiles to CommonJS and ships a CLI,
a library, and a GitHub Action, all from one source tree.

## Layout

```
src/
  checks/          One module per scoring dimension.
    helpers.ts     clampScore, severityPenalty, makeFinding.
    clarity.ts     Title/body presence, length, vague wording, placeholders.
    scope.ts       File references, large-scope phrases, estimate signals.
    acceptance.ts  Acceptance criteria, testing expectations, PR linkage.
    context.ts     Background/motivation, links, impact description.
    guidance.ts    Implementation pointers, stack, validation approach.
    metadata.ts    Labels, complexity label, Wave label, good-first label.
    stellar.ts     SEP refs, network, Friendbot, secret-key detection, Soroban, assets.
    index.ts       Runs all active dimension checks, normalizes weights.
  scorer.ts        Combines dimension scores into an issue score + verdict.
  readiness.ts     Repository-level scoring + Wave/GrantFox program checklists.
  report.ts        text / markdown / json renderers.
  github.ts        REST adapter: fetch issues/repos/files, post comments.
  templates.ts     Six issue template generators.
  config.ts        Config types, defaults, deep merge, validation, file loading.
  parse.ts         Issue input parsing (markdown, JSON, directory).
  text.ts          Text helpers: word count, file references, vague-term lookup.
  types.ts         Shared types (Issue, Finding, Verdict, ...).
  errors.ts        Error classes (ConfigError, InputError, GitHubError).
  cli.ts           CLI entrypoint and argument parsing.
  action.ts        GitHub Action entrypoint (reads inputs, writes outputs).
  index.ts         Public library API.
```

## Data flow

```
Input (file / stdin / GitHub issue)            Input (repo slug / dir / GitHub repo)
        |                                               |
        v                                               v
   parse.ts                                        readiness.ts
        |                                             |
        v                                             |
  checks/* -> dimension scores                       |
        |                                             |
        v                                             v
   scorer.ts -> score + verdict                report.ts (text/markdown/json)
        |                                             |
        +------------------+--------------------------+
                           v
                  cli.ts / action.ts output
```

### Issue scoring

`scoreIssue(issue, options)` runs every active dimension check over the issue text, produces a
0-100 score per dimension, and combines them with the configured weights. Verdicts are derived from
thresholds (`ready >= 80`, `needs-work >= 55`, else `blocked`), with a hard rule: an issue missing a
title or body is always `blocked`.

### Repository readiness

`assessRepoReadiness(repo, options)` gathers signals from repository metadata plus (optionally) the
open issues, scores five sections (documentation, issue quality, activity, onboarding, ecosystem),
and grades the total A-F. The same signals feed the Drips Wave and GrantFox checklists.

## Checks contract

Each check module exports a function taking `{ config, issue }` and returning `{ score, findings }`.
Findings carry an `id`, `dimension`, `severity` (`error` / `warning` / `info`), a `title`, a
`message`, and a `suggestion`. Severity maps to a penalty: errors subtract most, warnings less, and
info findings do not affect the score.

## Stellar secret-key detection

The `stellar` check scans the title and body for the Stellar secret-key format (`S` followed by 55
characters from `A-Z2-7`) and emits an `error` finding. This is intentionally conservative and should
never be relaxed silently: a leaked secret key must be rotated.

## Concurrency and rate limits

The GitHub adapter serializes requests and surfaces `403` rate-limit responses as a dedicated error
with `rateLimited: true`, so the CLI and action can fail with a clear message instead of a stack
trace.

## Build

`tsconfig.build.json` emits CommonJS into `dist/`. The built `dist/` is committed because the GitHub
Action references `dist/action.js` directly and the npm package's `files` whitelist ships `dist`.
