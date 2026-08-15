---
title: Add SEP-10 authentication flow to the TypeScript client
labels: ["enhancement", "complexity: high"]
---

## Why

Contributors and dApps using the TypeScript client must authenticate against Horizon-backed
services that speak SEP-10. Today they hand-roll the challenge-response dance, which leads to subtle
signature bugs. A reusable flow removes that friction and gives the project a clear, fundable task.

## What

Implement a `createAuthFlow()` helper in `src/auth.ts` using `@stellar/stellar-sdk` that:

1. Builds a SEP-10 challenge from the server's signing domain.
2. Signs it with the user's account keypair.
3. Returns the signed transaction for submission to the server.

Target: Testnet. For Testnet accounts, use Friendbot
(`https://friendbot.stellar.org`) to fund a throwaway account for testing.

## Scope

- Add `src/auth.ts` (new module) and export `createAuthFlow` from `src/index.ts`.
- Extend `src/auth.test.ts` with unit tests.
- Do not touch the payment or account-management modules.

## Acceptance criteria

- [ ] `createAuthFlow()` builds, signs, and returns a valid SEP-10 challenge response transaction.
- [ ] Unit tests cover a success path and a bad-signing-domain failure, and pass under `npm test`.
- [ ] A short usage example is added to `README.md`.

## Context

- SEP-10: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
- Reference: `@stellar/stellar-sdk`'s `TransactionBuilder` and `sign`.

## Validation

Run `npm test` and verify the new flow end-to-end on Testnet with a Friendbot-funded account. PR must
reference this issue with `Closes #<issue-number>`.
