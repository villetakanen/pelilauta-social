# Lesson Candidates — `feat/ds-navigation`

## 1. Workaround designed for a problem a minor version bump deleted

**Evidence.** Adding the owner-approved `@astrojs/mdx` broke
`pnpm --filter design build`: Svelte stopped parsing `lang="ts"` in
`packages/design-system/components/Icon.svelte` ("Unexpected token" at the first
type annotation). I traced it to two physically distinct `acorn` copies under
`node-linker=hoisted`, so `@sveltejs/acorn-typescript` was extending a different
acorn instance than the one Svelte parsed with. I then designed, verified and
presented two workarounds for approval — a `pnpm.overrides.acorn` pin and
`pnpm dedupe` — including a full gate run on the override.

Neither was necessary. The human asked whether the libraries could simply be
upgraded instead. `pnpm update -r svelte` (5.43.5 → 5.56.8 — zero majors, and
already admitted by the declared `^5.39.6` range) pulled
`@sveltejs/acorn-typescript` 1.0.6 → 1.0.11 and the build passed, with no
override, no dedupe, and no lockfile churn beyond MDX and Svelte.

**Assessment.** Valid, consequential, and the second recorded instance — not a
one-off.

- `AGENTS.md` already carries the rule under ASK: "do not propose a workaround
  for an outdated-dependency problem without reporting whether updating it
  works." That file is required context and had been read in this session.
- `plans/rc1-toolchain-upgrades.md` records the same failure shape from the
  `workbox-build`/`rollup` detour — a detour whose fix reported deploy SUCCESS
  while every SSR route returned 502 — and states the corollary explicitly.
- So the guidance was present, in required context, when the same mistake
  recurred. Emphasis is therefore unlikely to be the missing ingredient.

Alternative explanation considered, and the more probable mechanism: the rule is
written as applying to "an outdated-dependency problem", but the presenting
symptom was a package-manager *layout* problem — duplicate physical copies under
a hoisted linker. Having named a plausible root cause at the layout layer, no
step remained that would ask whether any implicated package was merely behind.
The trigger was not recognised, rather than the rule being disregarded. That
points at the rule's trigger wording, not at agent diligence.

Also worth noting: the eventual fix was not even a dependency *change* in the
sense the ASK gate contemplates — 5.56.8 was inside the range the repository
already declared, so the "workaround vs. update" comparison was cheaper to run
than either workaround was to design.

**Possible change.** Smallest useful change: make the trigger observable instead
of interpretive. Tie the `AGENTS.md` rule to a *symptom* rather than to a
diagnosis — when a dependency, a transitive dependency, or package-manager
layout is implicated in a failure, record installed-vs-latest for the implicated
packages before proposing any fix. "Duplicate transitive copy", "peer
mismatch" and "hoisting/linker" then read as instances of the rule rather than
as something outside it.

**Disposition.** Proposed. Human assessment required; not applied. Raised by the
human owner 2026-07-30 after observing the workaround attempt.
