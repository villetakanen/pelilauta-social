---
name: technical-writer-rewrites-beyond-the-changeset
branch: feat/21-rc4
date: 2026-09-21
---

**Context:** `pnpm technical-writer <paths>` names files, not hunks. Given a path,
it reads the whole file and rewrites every sentence it judges off register,
whether or not the changeset touched that sentence.

**What happened:** the UAT initialization amendment changed four lines of
`docs/ACCEPTANCE_TESTING.md`. The writer returned a 42-line diff that rewrote the
document end to end: it reflowed every paragraph onto single long lines, breaking
the file's 80-column wrapping; it replaced "which carries the same Firestore,
Storage and Auth products as production on a separate project" with "which
isolates Firestore, Storage, and Auth configurations on a separate project", a
different and false claim; and it dropped "gitignored" from the description of
`server_principal.json` and `credentials.ts`, the word that states why those files
are absent from a clone. In the same run it stripped the four `// --- ... ---`
banner comments that had structured `uat/pelilauta/e2e/reset-and-seed.ts` since
the file was written, and replaced "Registration starts clean; this is the one
Auth state a run writes" with "Clears custom claims and documents for newUser to
prepare registration journeys" — a why traded for a restatement of the code.
The pass was reverted whole and the four lines reapplied by hand.

**Suspected why:** the runner's unit is a file. Nothing in the composed prompt
distinguishes a sentence the changeset introduced from a sentence that has stood
for twenty commits, so every sentence is a candidate and the register judgment
is applied uniformly to both.

**Fix:** give the runner the changeset. When it is invoked with no paths it
already takes everything changed since the branch point — it can take the diff as
well, and constrain rewriting to added and modified lines, reporting anything it
would change outside them rather than changing it. Failing that, the skill should
state that an unchanged sentence is out of scope, and that a rewrite may not drop
a fact or a stated reason.
