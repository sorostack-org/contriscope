# Contributing

Thanks for taking the time to contribute to ContriScope.

## Code of conduct

This project and everyone participating in it is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to contribute

### Reporting bugs

Open an issue using the [bug template](.github/ISSUE_TEMPLATE/bug.md). Include the ContriScope
version, the command you ran, the input you used, and the output you got. If the input contains a
Stellar secret key, replace it with a placeholder before pasting it.

### Suggesting features

Open an issue using the [feature template](.github/ISSUE_TEMPLATE/feature.md). Explain the problem
you are trying to solve, not just the feature you want.

### Writing code

1. Fork the repository and create a branch: `feat/<your-feature>` or `fix/<your-fix>`.
2. Install dependencies: `npm install`.
3. Make your changes. Follow the existing code style; the linters and formatters will enforce it.
4. Add or update tests under `tests/`. Every public API change should come with tests.
5. Run the full check locally:

   ```sh
   npm run ci
   ```

   This runs typecheck, lint, format check, the test suite, and the build. All must pass.

6. Commit with a [Conventional Commits](https://www.conventionalcommits.org/) message, e.g.
   `feat(scorer): add a severity filter option` or `fix(cli): exit 2 on unknown commands`.

### Project structure

| Path                           | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `src/checks/`                  | One check module per scoring dimension.             |
| `src/scorer.ts`                | Combines dimension checks into a score and verdict. |
| `src/readiness.ts`             | Repository-level scoring and program checklists.    |
| `src/report.ts`                | Text, markdown, and JSON renderers.                 |
| `src/github.ts`                | GitHub REST adapter (fetch + comment).              |
| `src/cli.ts` / `src/action.ts` | CLI and GitHub Action entrypoints.                  |
| `tests/`                       | Vitest unit tests plus fixtures.                    |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture.

## Development workflow

- `npm run test:watch` — run tests in watch mode.
- `npm run lint:fix` — autofix lint issues.
- `npm run format` — format all source files.
- `npm run test:coverage` — coverage report.

## Commit message rules

We use [commitlint](https://commitlint.js.org/) with the conventional config and
[husky](https://typicode.github.io/husky/). Common types: `feat`, `fix`, `docs`, `chore`, `refactor`,
`test`, `ci`, `perf`, `style`.

## Security

Found a security issue? Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Questions

Open a discussion in the repository or reach out through the channels listed in
[SUPPORT.md](SUPPORT.md).
