# Release Runbook

Pelilauta v21 releases are owned by the workspace root. The root `package.json`
version and repository tag identify the release. Nested application package
versions retain their own compatibility meaning and are not changed as release
bookkeeping.

## Prepare

1. Require an explicit release request and exact root semantic version. Use
   `beta.X` for deployable product increments that are not yet claimed as
   complete v18 replacements.
2. Confirm the requested baseline is integrated and its required PR checks
   passed. Do not repeat those checks manually on unchanged code.
3. Update the root version and project status together.
4. Confirm the worktree contains no generated output, credentials, or unrelated
   changes.

## Release

1. Commit the release preparation with a Conventional Commit message.
2. Push the delivery branch and open a pull request against `main`.
3. Stop for the human owner's review. A ready preview does not authorize merge.
4. Merge only on explicit instruction and without bypassing a failing
   repository-defined gate.
5. When explicitly instructed to publish the accepted release, verify the
   production endpoint responds from the merged commit.
6. Create an annotated `v<version>` tag on that exact merge commit and push it.
7. Confirm local `main`, `origin/main`, the root version, and the tag agree.

## Rollback

Do not move or reuse a published tag. Revert the bounded merge commit, verify the
previous production behavior, and release a new version if a tagged correction
is required.

## Current Limits

There is no generic release command or CI release pipeline. Pull requests run
the root `pnpm verify` gate; release identity and publication remain explicit
human decisions.
