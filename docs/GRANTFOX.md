# GrantFox

GrantFox is a grant program that funds open-source projects. Maintainers apply, and the program
evaluates the project against published criteria — notably the quality and clarity of the issue
tracker and how maintainable the project is.

> ContriScope is not affiliated with or endorsed by GrantFox. The checklist below reflects the
> program's published documentation and feedback patterns, and is provided to help projects prepare;
> it is not a guarantee of acceptance.

## What GrantFox looks for

Public guidance and reviewer feedback emphasize:

- **A clear, well-maintained repository** with documentation and onboarding.
- **Contributor-ready issues** — specific, scoped, and with acceptance criteria.
- **Evidence of activity** — issues being opened and resolved.
- **Good issue hygiene** — templates, labels, and clear processes.

Common rejection reasons include vague or poorly scoped issues, missing documentation, low activity,
and issues that do not define what "done" means.

## How ContriScope reflects this

The GrantFox readiness checklist in the repository report maps the criteria to concrete signals:

| Checklist item             | Signal                                 |
| -------------------------- | -------------------------------------- |
| README present             | `README.md` exists and is substantial  |
| CONTRIBUTING guide present | `CONTRIBUTING.md` exists               |
| Issue quality is high      | Average issue score across open issues |
| Issues are well scoped     | Average scope dimension score          |
| Repository is active       | Open + closed issue counts             |
| Issue templates exist      | `.github/ISSUE_TEMPLATE/*` present     |

Each item is reported as `met: true/false` with a detail line. Use it to close the gaps before
submitting an application.

## The issue-quality gate

The single highest-leverage change is writing issues that score `ready`. GrantFox reviewers read the
tracker like a maintainer would: can a stranger pick this up and complete it without a conversation?

Run every issue through ContriScope until it scores `ready`:

```sh
contriscope check path/to/issue.md
```

Then keep the bar enforced with the GitHub Action's `fail-below` input, so new issues that do not
meet the bar get flagged (and optionally commented on) automatically.

## Templates

Use `contriscope template` to generate issue templates that force the structure reviewers reward:

```sh
contriscope template all --write --dir .github/ISSUE_TEMPLATE
```

## Running the GrantFox report

```sh
contriscope check-repo --slug Sorostack/contriscope --format json
```

The `programs.grantfox` section lists each checklist item with `met: true/false`.
