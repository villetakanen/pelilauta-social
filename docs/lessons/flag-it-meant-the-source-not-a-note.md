---
name: flag-it-meant-the-source-not-a-note
branch: feat/21-1
date: 2026-10-04
---

**Context:** During #165 chunk 4 the operator saw a server-side import of a browser store and said: "flag it as an error, but we won't fix it now", quoting the changed line `src/stores/profiles/index.ts:161`.

**What happened:** The first-mate invoked the `lesson` skill and wrote `docs/lessons/server-code-imports-the-client-profile-store.md`, then edited its own memory. The source lines stayed unmarked. The operator asked "did we flag the line in the file, or not?" before the `ERROR` comments went into `DiscussionApp.astro:5-7` and `stores/profiles/index.ts:161-163`.

**Suspected why:** The `lesson` skill's description, "record one finding ... an error", matched the word "flag", and a quoted file and line read as the evidence for a note rather than the place to put the mark.

**Fix:** In the `first-mate` or `lesson` skill, one sentence: a request to flag a line, with the file and line quoted, is a request for a comment at that line; a lesson note is a separate ask.
