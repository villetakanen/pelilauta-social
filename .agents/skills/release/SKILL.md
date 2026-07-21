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

1. Read and update the active branch lessons throughout release preparation.
   Record gate failures, deployment behavior, versioning decisions, and
   corrected assumptions as they occur.
2. Confirm explicit human approval for the release and exact version. Do not
   infer that every merge or branch close is a named release.
3. Identify the exact delivered content baseline approved for release and read
   its applicable specs, slice records, lessons, human acceptance, and checks.
4. Confirm any required `delivery-review` findings are resolved or carry an
   explicit human decision.
5. Inspect Git status, the release delta, recent commits, remote tracking, and
   existing tags before changing release metadata.
6. Update only the root package version and current release-facing status. Do
   not change nested app versions as release bookkeeping.
7. Run every release check required by the delivered slices. Classify each as
   repository-gated, manually run, skipped, known broken, or human-only; do not
   report the existence of an ungated test as passing evidence.
8. Commit and push only the intended release preparation when explicitly
   approved. Open or update its pull request and never bypass a failing gate.
   Its merge creates the final versioned release commit.
9. After merge, verify that the final release commit contains the approved
   content baseline, then verify the production endpoint from that commit.
10. Tag the final versioned release commit with annotated `v<version>` and push
    the tag.
11. Report the commit, tag, checks and their gate status, compatibility
    assumptions, negative-state evidence, and any remaining maturity gate.

Never move an existing release tag, bypass a failing gate, infer release
approval, or print credentials.
