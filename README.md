# ContriScope

Score GitHub issues and repositories for funded-contribution readiness on the Stellar ecosystem.

ContriScope analyses an issue's clarity, scope, acceptance criteria, context, guidance, metadata and
Stellar/Soroban specifics, then produces a 0-100 readiness score, a verdict (`ready`, `needs-work`,
`blocked`) and actionable findings. It also scores whole repositories against the requirements of
funding programmes such as Drips Wave and GrantFox.

## Highlights

- Zero runtime dependencies — a small TypeScript CLI, library and GitHub Action.
- Deterministic scoring with a weighted model you can tune via `.contriscope.json`.
- Stellar-aware checks including Soroban contract hints and leaked-secret detection.
- Repository readiness reports with per-programme checklists.
- Ships as a CLI, a library API, and a GitHub Action.

## Getting started

```sh
npm install        # install dev dependencies
npm run build      # compile to dist/
node dist/cli.js check examples/good-issue.md
```

Requires Node.js 18 or newer.

## Usage

```sh
contriscope check examples/bad-issue.md          # score one issue
contriscope check-repo --slug owner/repo         # score a repository
contriscope check-repo --path ./issues           # score a local directory
contriscope template all --write                 # generate issue templates
contriscope init                                 # scaffold config + templates
```

Exit codes: `0` success, `1` below threshold / blocked, `2` usage error.

## Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data flow, [docs/SCORING.md](docs/SCORING.md)
for the scoring model, and [docs/GITHUB_ACTION.md](docs/GITHUB_ACTION.md) for Action usage.

## License

MIT
