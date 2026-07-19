# Release Runbook

Pelilauta v21 releases are owned by the workspace root. The root `package.json`
version and repository tag identify the release. Nested application package
versions retain their own compatibility meaning and are not changed as release
bookkeeping.

## Prepare

1. Confirm the delivery spec, plan, retrospective, and human acceptance state.
2. Choose the approved root semantic version. Use `beta.X` for deployable
   product increments that are not yet claimed as complete v18 replacements.
3. Update the root version and project status together.
4. Run the checks named by the delivery plan from the workspace root.
5. Confirm the worktree contains no generated output, credentials, or unrelated
   changes.

## Release

1. Commit the release preparation with a Conventional Commit message.
2. Push the delivery branch and open a pull request against `main`.
3. Wait for the deploy preview and complete any remaining human review.
4. Merge without bypassing a failing repository-defined gate.
5. Verify the production endpoint responds from the merged commit.
6. Create an annotated `v<version>` tag on the exact merge commit and push it.
7. Confirm local `main`, `origin/main`, the root version, and the tag agree.

## Rollback

Do not move or reuse a published tag. Revert the bounded merge commit, verify the
previous production behavior, and release a new version if a tagged correction
is required.

## Current Limits

There is no generic release command or CI release pipeline. Follow the delivery
plan's checks and this runbook directly until repetition justifies automation.
