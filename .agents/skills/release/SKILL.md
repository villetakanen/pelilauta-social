---
name: release
description: Leave beta, or roll back a published release. Not needed for ordinary merges.
---

# Release

Ordinary work does not use this skill. Every pull request bumps the beta version,
every merge deploys, and CI tags the merge commit from the root version. That is
the release process.

Two things are decisions, and they are the owner's.

## Leaving beta

Cutting `21.0.0` — or any version that is not a beta increment — is a claim that v21
replaces live v18. Only the owner makes it, and only on an explicit request naming
the version.

Set the root version and the project's release-facing status together, in the pull
request that carries the work. Nested application versions keep their own meaning and
are not touched as release bookkeeping.

## Rolling back

A published tag never moves and is never reused. Revert the merge commit, confirm the
previous behaviour is back in production, and let the next merge carry a new version.
