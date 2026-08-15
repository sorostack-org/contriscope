---
name: Soroban contract task
about: Implementation work on a Stellar Soroban smart contract
title: [soroban]
labels: ["smart contract", "complexity: medium"]
---

## Why

Explain the contract behaviour being added or changed and its impact on users (e.g. escrow, payments, splitter).

## Requirements and context

- Contract function(s) affected: (list them)
- Target network: **Testnet** / **Mainnet** (delete one)
- Contract ID (if known): `CA...` or 'not yet deployed'
- Storage keys / admin / authority accounts involved: (describe)

## Scope

State the functions and files involved (e.g. `contracts/escrow/src/lib.rs`). Keep it to one contract concern.

## Acceptance criteria

- [ ] New/updated Soroban contract functions behave as specified
- [ ] Unit tests cover the new logic, including edge cases
- [ ] `cargo test` passes and the contract builds to `wasm32-unknown-unknown`
- [ ] Behaviour is documented (contract doc comment or docs/)

## Security considerations

- [ ] No secret keys or live accounts referenced — use placeholders (`G...`, `S...`)
- [ ] Re-entrancy, auth, and panic paths are considered
- [ ] Correct network (Testnet vs Mainnet) is used in examples

## Suggested execution

- [ ] Fork the repository and create a branch
- [ ] Make the changes in a focused, reviewable commit
- [ ] Add or update tests
- [ ] Run the project's checks (lint, typecheck, tests)
- [ ] Open a pull request and link it with `Closes #<issue-number>`

## Definition of done

- [ ] The change behaves as described in the acceptance criteria
- [ ] Tests pass and coverage is maintained
- [ ] Documentation (README/docs) is updated if behaviour changed
- [ ] The pull request is scoped to this issue only

## Complexity

Suggested complexity: **MEDIUM**. Adjust the complexity label to match the real effort.
