# Scoring model

Every issue is scored 0-100 across seven weighted dimensions. A finding is generated for each issue
the check detects, with a severity that drives the penalty applied to that dimension.

## Dimensions and weights

| Dimension           | Weight | What it measures                                                       |
| ------------------- | -----: | ---------------------------------------------------------------------- |
| Clarity             |   0.25 | Is the task stated precisely, without vague wording or placeholders?   |
| Scope               |   0.25 | Is the change bounded to specific files, modules, or packages?         |
| Acceptance criteria |   0.20 | Is "done" defined, with test/verification expectations and PR linkage? |
| Context & impact    |   0.15 | Does the issue explain why it matters and who benefits?                |
| Technical guidance  |   0.10 | Does it point to the files, stack, and validation approach?            |
| Labels & metadata   |   0.05 | Are type, complexity, and program labels applied?                      |
| Stellar ecosystem   |   0.05 | Stellar-specific quality: SEP refs, network, Friendbot, secret keys.   |

Weights are configurable; partial configs are deep-merged over the defaults. The sum is normalized by
the scorer, so custom weights do not need to add up to exactly 1.

## Severity and penalties

| Severity  | Penalty | Meaning                                                                           |
| --------- | ------: | --------------------------------------------------------------------------------- |
| `error`   |      25 | The issue cannot be worked on as written (missing title/body, leaked secret key). |
| `warning` |      12 | A meaningful gap that will slow down or reject a funded contribution.             |
| `info`    |       0 | An optional improvement that helps but is not required.                           |

## Verdicts

| Verdict      | Range (default) | Meaning                                                               |
| ------------ | --------------- | --------------------------------------------------------------------- |
| `ready`      | >= 80           | Safe to list as a funded contribution.                                |
| `needs-work` | 55-79           | Workable, but a reviewer would likely send it back for clarification. |
| `blocked`    | < 55            | Not actionable; must be rewritten before listing.                     |

**Hard rule:** an issue missing a title or a body is always `blocked`, regardless of score.

## What each dimension checks

### Clarity

- Title present and 8-80 characters; body present, at least 100 characters and 20 prose words.
- Vague terms (`improve`, `clean up`, `fix things`, `asap`, ...) flagged in title and body.
- Placeholder tokens (`lorem ipsum`, `fixme`, `???`, ...) flagged.

### Scope

- File, module, or package references (`src/foo.ts`, `@stellar/stellar-sdk`) reward scope.
- Large-scope phrases (`rewrite everything`, `entire codebase`) penalize.

### Acceptance criteria

- An "Acceptance criteria" / "Definition of done" section with checkboxes.
- Testing expectations stated.
- PR-to-issue linkage specified (e.g. `Closes #123`).

### Context & impact

- Background/motivation paragraph.
- Links to related issues, docs, or designs.
- Impact description ("who benefits, what improves").

### Technical guidance

- Implementation pointers (key files/functions/packages).
- Technology stack mentioned.
- Validation approach ("run `npm test`, verify on Testnet").

### Labels & metadata

- At least one type label.
- A complexity label (`complexity: trivial|medium|high`) — required for Drips Wave.
- The `Stellar Wave` label when the issue targets a Wave program.
- The `good first issue` label for beginner tasks.

### Stellar ecosystem

Only active when the issue mentions Stellar/Soroban content.

- Network targeting stated (Testnet/Mainnet).
- Friendbot mentioned for Testnet work.
- SEP numbers validated against the known list; unknown SEPs flagged.
- Stellar public keys (`G...`) flagged, with a stronger warning unless clearly examples.
- **Secret keys (`S...`) produce an `error`** — never accept these in an issue.
- Soroban contract work rewarded for including contract ID, storage keys, authority.
- Assets rewarded for stating asset code and issuer.

## Repository readiness

Repository scoring uses five sections with these default weights:

| Section                | Weight |
| ---------------------- | -----: |
| Documentation          |   0.20 |
| Issue quality          |   0.30 |
| Activity & maintenance |   0.15 |
| Contributor onboarding |   0.20 |
| Ecosystem signals      |   0.15 |

The total maps to a grade: A (>= 90), B (>= 75), C (>= 60), D (>= 50), F (below 50). The same
signals feed the Drips Wave and GrantFox checklists described in [WAVE.md](WAVE.md) and
[GRANTFOX.md](GRANTFOX.md).

## Configuring

Override thresholds, weights, and label names in `.contriscope.json`:

```json
{
  "verdict": { "ready": 85 },
  "weights": { "clarity": 0.3 },
  "minDescriptionLength": 200
}
```

The full schema is in [contriscope.schema.json](../contriscope.schema.json).
