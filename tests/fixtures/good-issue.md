---
title: Add SEP-10 authentication flow to the TypeScript client
labels: ["enhancement", "complexity: medium"]
---

## Why

Contributors currently have to implement SEP-10 authentication by hand, which causes frequent errors with memo requirements and network endpoints. Standardising it improves the developer experience for everyone building on Stellar.

## What

Implement an `authenticateWithAnchor(server, anchorKeypair)` helper in `src/lib/sep10.ts` that returns the signed JWT, mirroring the pattern in `@stellar/stellar-sdk`.

## Requirements and context

- Target network: Testnet
- Uses `@stellar/stellar-sdk` v12+
- Related issue: #42

## Acceptance criteria

- [ ] Helper signs the SEP-10 challenge and returns the JWT
- [ ] Handles the memo-before-signing edge case
- [ ] Unit tests cover the happy path and failure cases
- [ ] `npm test` passes

## Suggested execution

- [ ] Implement in `src/lib/sep10.ts`
- [ ] Add tests in `tests/sep10.test.ts`
- [ ] Open a PR and link it with `Closes #42`

## Complexity

Medium.
