# Agent instructions

Guidance for human and AI contributors working on ContriScope.

## Repository overview

ContriScope is a zero-runtime-dependency TypeScript CLI + library + GitHub Action that scores GitHub
issues and repositories for funded-contribution readiness (Drips Wave + GrantFox) on the Stellar
ecosystem. Sibling project in the same org: `sorostack-org/stellar-payments-kit`.

## Key conventions

- Windows PowerShell 5.1 dev environment: no `&&`, one command per line with `;` or `if ($?) { }`.
- `npm run ci` = typecheck + lint + format:check + test + build. Always pass before committing.
- Prettier formats everything; `dist/` and `node_modules/` are ignored by Prettier.
- `dist/` is generated but MUST be committed (the GitHub Action runs `dist/action.js`). After any
  source change, run `npm run build` and commit the result. CI verifies `dist/` is in sync.
- Conventional Commits enforced by commitlint + husky.
- Do not add comments unless they earn their place; match the existing terse style.
- Never commit secrets: no Stellar secret keys (`S[A-Z2-7]{55}`), tokens, `.env` files.

## Architecture quick map

- `src/checks/<dimension>.ts` — one module per scoring dimension, returning `{ score, findings }`.
- `src/scorer.ts` — combines dimensions into a 0-100 score + verdict.
- `src/readiness.ts` — repository-level scoring and Wave/GrantFox program checklists.
- `src/report.ts` — text/markdown/json renderers.
- `src/github.ts` — REST adapter (fetch issues/repos/files, post comments).
- `src/cli.ts` and `src/action.ts` — entrypoints.
- `tests/` — Vitest; fixtures live in `tests/fixtures/`.

See `docs/ARCHITECTURE.md` for the data flow and the checks contract.

## Scoring invariants

- Dimension weights live in `src/config.ts` (`DEFAULT_CONFIG`); configs are deep-merged over
  defaults. Do not change defaults without updating `docs/SCORING.md`.
- Issues missing a title or body are always `blocked` (see `src/scorer.ts`).
- Secret-key detection in `src/checks/stellar.ts` must never be relaxed silently.
- When adding a check, add a finding with an `id`, `dimension`, `severity`, `title`, `message`, and
  `suggestion`, and wire it into `src/checks/index.ts`.

## Tests

- Add/update tests under `tests/` alongside any public API change.
- Run `npm run test:watch` during development and `npm run ci` before committing.

## Docs

- Keep `README.md` and `docs/` in sync with behaviour and config defaults. Docs are part of the
  shipped package quality, not an afterthought.

## Reference facts (program guidance, not endorsements)

- Drips Wave complexity points: Trivial 100 / Medium 150 / High 200; Wave label: `Stellar Wave`.
- These facts are external guidance; never claim affiliation with or endorsement by Drips or
  GrantFox in docs or code.
