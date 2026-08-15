# Security Policy

ContriScope has a special responsibility here: one of its own checks detects leaked Stellar secret
keys in issues. Please apply the same standards to reports about this project itself.

## Supported versions

| Version           | Supported |
| ----------------- | --------- |
| latest (>= 0.1.0) | Yes       |
| older             | No        |

## Reporting a vulnerability

Do **not** open a public issue for security problems. Instead, email the maintainers at
`security@sorostack.dev` (or open a private report if you are a collaborator).

Please include:

- The affected version(s).
- A description of the vulnerability and its impact.
- Steps to reproduce, minimized where possible.
- Any proof-of-concept, redacted of real secrets.

If the input data involves a Stellar secret key, replace the actual key with a placeholder before
sharing anything.

## What to expect

- You will receive an acknowledgement within 3 business days.
- We will assess the report and reply with a plan and a target timeframe.
- You will be credited for the discovery (unless you prefer to stay anonymous).

## Scope

In scope: the `src/` codebase, the CLI, the published npm package, and the GitHub Action.

Out of scope: vulnerabilities in third-party dependencies (report those upstream), and issues that
require the attacker to already have write access to a target repository.

## Key handling

Never commit secrets. If you believe a secret key (Stellar `S...`, GitHub token, etc.) has been
exposed, rotate it immediately and follow the repository's [security guidance](SECURITY.md).
