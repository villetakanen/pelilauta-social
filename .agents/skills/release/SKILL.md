---
name: release
description: Version, verify, publish, and tag an explicitly approved Pelilauta root release after its delivery slices and human acceptance are complete.
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
2. Require an explicit release request and exact version. Do not infer a release
   from a merge, branch close, passing checks, or a ready deploy. Follow the
   exact requested boundary: preparing a release PR does not itself authorize
   merging or tagging it.
3. Identify the exact delivered content baseline approved for release and read
   its applicable specs, PRs, human acceptance, and checks.
4. Confirm any required `delivery-review` findings are resolved or carry an
   explicit human decision.
5. Inspect Git status, the release delta, recent commits, remote tracking, and
   existing tags before changing release metadata.
6. Update only the root package version and current release-facing status. Do
   not change nested app versions as release bookkeeping.
7. Reuse passing repository-gated checks attached to the exact delivered
   commits. The release pull request runs `pnpm verify`; do not manually repeat
   unchanged delivery checks. Run an additional check only when release
   metadata can affect it or the human owner explicitly requests it.
8. Commit and push only the intended release preparation when explicitly
   requested. Open or update its pull request, then stop unless the human owner
   explicitly requests the merge. Never bypass a failing gate. Its merge
   creates the final versioned release commit.
9. After merge, verify that the final release commit contains the approved
   content baseline, then verify the production endpoint from that commit.
10. Tag the final versioned release commit with annotated `v<version>` and push
    the tag only when the explicit release instruction includes publication of
    the accepted merge.
11. Report the commit, tag, checks and their gate status, compatibility
    assumptions, negative-state evidence, and any remaining maturity gate.

Never move an existing release tag, bypass a failing gate, infer release
approval, or print credentials.
