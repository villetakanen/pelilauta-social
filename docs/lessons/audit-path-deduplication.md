---
name: audit-path-deduplication
branch: feat/21-2
date: 2026-10-23
---

**Context:** The Firebase Admin 14.5 application upgrade reused transitive versions from the workspace lockfile.

**What happened:** The production audit listed `protobufjs` 7.5.4 through a Netlify dependency path, while the installed Admin Firestore package resolved the same vulnerable version. Filtering advisory paths for `firebase-admin` reported no match. Inspecting the resolved SDK graph found the affected package and led to refreshing its transitive dependencies.

**Fix:** Compare resolved package names and versions against advisory findings instead of treating displayed dependency paths as a complete graph.
