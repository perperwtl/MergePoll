# Contributing to MergePoll

Thanks for helping make audience questions easier to answer. Useful contributions
include confusing question pairs, reproducible bug reports, accessibility fixes
and improvements to the setup instructions.

## Before coding

Read the [license guide](docs/LICENSING.md). This project is licensed under AGPL-3.0-only,
which permits personal, institutional and commercial use. Discuss larger features in
an issue before implementing them so the design and scope can be agreed on.

## Local workflow

1. Fork and clone the repository.
2. Follow the [quick start](README.md#quick-start).
3. Create a branch for your change.
4. Run the [Docker development checks](docs/SELF_HOSTING.md#development-checks-in-docker)
   and rebuild the local app to verify your change.
5. Open a pull request describing the problem, resulting behavior and checks.
   Include screenshots for visible UI changes.

Tests must run without API keys and must not spend live model credits. If a
change concerns Jev behavior, describe any separately run live checks and their
limitations. Never put participant data, secrets or identifying information in
fixtures or screenshots.

## Where to help

- **Grouping examples:** similar wording with different answers, broader/narrower
  questions, unrelated requests and false merges. Supply synthetic or consented
  text with your expected grouping and rationale.
- **Accessibility:** keyboard navigation, dialog focus, contrast and small-screen use.
- **Docker setup:** clearer instructions, operational limits and local runtime checks.
- **Roadmap:** see [planned work](docs/ROADMAP.md).

## Contribution rights

You retain copyright. Code contributions need explicit acceptance of [CLA.md](CLA.md)
in the PR checklist, so the maintainer can also license accepted contributions
for commercial use. If you cannot grant those rights, say so before submitting
code. The maintainer must confirm consent and third-party license compatibility
before merging. No rights are assumed from a bug report or feature request.

Please keep discussion respectful, explain disagreements with examples, and
report security concerns as described in [SECURITY.md](SECURITY.md).
