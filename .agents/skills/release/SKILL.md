---
name: release
description: Leave beta, or roll back a published release. Not needed for ordinary merges.
---

# Release

Ordinary work does not use this skill. Every merge to main is a release: the branch
takes one beta bump after the previous merge, the merge deploys, and CI tags the
merge commit from the root version. That is the release process. A second bump before
the merge burns a version and never becomes a release.

Two things are decisions, and only the owner makes them.

## Leaving beta

Cutting `21.0.0` — or any version that is not a beta increment — is a claim that v21
replaces live v18. Only the owner makes it, and only on an explicit request naming
the version.

Set the root version and the project's release-facing status together, in the pull
request that carries the work. Nested application versions keep their meaning and
are not touched as release bookkeeping.

## Rolling back

A published tag never moves and is never reused. Revert the merge commit, confirm the
previous behaviour is back in production, and let the next merge carry a new version.
