---
name: release
description: Prepare and publish an approved Pelilauta v21 root release after delivery checks and human acceptance are complete.
---

# Root Release

Follow `docs/runbooks/releases.md`. Release ownership, versioning, merge, and
tagging belong to the workspace root.

## Procedure

1. Read and update the active branch file under `docs/lessons/` throughout
   release preparation. Record gate failures, deployment behavior, versioning
   decisions, and corrected assumptions as they occur.
2. Confirm explicit human approval for the release and version.
3. Read the delivery spec, plan, lessons, and applicable checks.
4. Inspect Git status, the complete branch diff, recent commits, and existing
   tags before changing release metadata.
5. Update only the root package version and current project-status references.
   Do not change nested app versions as release bookkeeping.
6. Run every deterministic check required by the delivery plan and report known
   diagnostics.
7. Commit and push only the intended release preparation.
8. Open or update the pull request, wait for repository-defined gates, and merge
   only after human acceptance.
9. Verify the merged production endpoint.
10. Tag the exact merge commit with annotated `v<version>` and push the tag.
11. Report the merge commit, tag, checks, compatibility assumptions, and any
    remaining gate for the next maturity level.

Never move an existing release tag, bypass a failing gate, infer release
approval, or print credentials.
