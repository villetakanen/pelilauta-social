---
name: release
description: Leave beta, or roll back a published release. Not needed for ordinary merges.
---

# Release

Ordinary work does not use this skill. Every merge to main is a release: the release
branch takes one beta bump after the previous merge, the merge deploys, and CI tags
the merge commit from the root version. That is the release process. A second bump
before the merge burns a version and never becomes a release.

Two decisions require owner authorization.

## Leaving beta

Cutting `21.0.0` — or any version that is not a beta increment — is a claim that v21
replaces live v18. Only the owner makes it, and only on an explicit request naming
the version.

The claim needs evidence: run `pnpm test:uat`, the acceptance suite
`docs/ACCEPTANCE_TESTING.md` describes, and say in the pull request that it passed.
It is the only end-to-end evidence a reader can do what the journeys promise; the
`apps/pelilauta/e2e` suite does not give it (#120).

Set the root version and the release-facing status of the project together, in the pull
request that carries the work. Nested application versions keep their meaning and
are not touched as release bookkeeping.

## Rolling back

A published tag never moves and is never reused. Revert the merge commit, confirm the
previous behavior is back in production, and let the next merge carry a new version.
