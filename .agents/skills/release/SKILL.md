---
name: release
description: Version, verify, merge, deploy, and tag an explicitly approved Pelilauta root release.
---

# Root Release

Follow `docs/runbooks/releases.md`. Release ownership, versioning, merge, and
tagging belong to the workspace root. Use `delivery-slice` for ordinary feature
implementation, commits, pushes, and pull requests. This skill owns named
release identity and publication, not the full lifecycle of a feature branch.

## Procedure

1. Read the branch lessons queue when one exists. Do not duplicate check or
   deploy output into a release log; add to lessons only when release work
   reveals a reusable process or harness candidate.
2. Require an explicit merge or release request and exact version. Every merge
   to `main` deploys and is a release; branch close, passing checks, and a ready
   preview are not release approval.
3. Identify the exact proposed merge baseline approved for release and read
   its applicable specs, PRs, human acceptance, and checks.
4. Confirm any required `delivery-review` findings are resolved or carry an
   explicit human decision.
5. Inspect Git status, the release delta, recent commits, remote tracking, and
   existing tags before changing release metadata.
6. Update only the root package version and current release-facing status. Do
   not change nested app versions as release bookkeeping.
7. Reuse passing targeted checks attached to the proposed merge. The updated
   pull request runs `pnpm verify`; do not manually repeat unchanged delivery
   checks. Run an additional check only when release metadata can affect it or
   the human owner explicitly requests it.
8. Commit and push the release preparation to the delivery pull request. Stop
   unless the human owner explicitly requested the merge. Never bypass a failing
   gate. The merge creates the final versioned release commit and deploys it.
9. After merge, verify that the final release commit contains the approved
   content baseline, then verify the production endpoint from that commit.
10. Tag the final versioned release commit with annotated `v<version>` and push
    the tag after the explicitly authorized merge publishes it.
11. Report the commit, tag, checks and their gate status, compatibility
    assumptions, negative-state evidence, and any remaining maturity gate.

Never move an existing release tag, bypass a failing gate, infer release
approval, or print credentials.
