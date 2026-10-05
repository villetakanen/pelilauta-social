---
name: server-code-imports-the-client-profile-store
branch: feat/21-1
date: 2026-10-04
---

**Context:** Chunk 4 of #165 resolves reply attribution on the server through `/api/profiles/<uid>.json` and hands the island a `PublicProfile` map.

**What happened:** `apps/pelilauta/src/threads/server/DiscussionApp.astro:5-9` imports `normalizeProfileData`, `createEmptyPublicProfile` and the `PublicProfile` type from `src/stores/profiles`, a browser store that opens a `persistentAtom` and holds module state at import. `src/stores/profiles/index.ts:161` gained `export` on `createEmptyPublicProfile` for that import. The brief named the store as the source of the projection and the anonymous fallback, and said the import was acceptable because the module was already loaded during server rendering. The operator marked that use of a client store on the server as an error, not to be fixed in this cycle.

**Suspected why:** The projection and the anonymous fallback have no home outside the browser store, so reuse pulled server code into the store.

**Fix:** Move the public-profile shape, its projection and the anonymous fallback to a module with no runtime state, under `src/schemas` or beside the profile route, and point both the store and the server at it.
