---
name: check-upgradability-before-workaround
branch: feat/ds-navigation
date: 2026-07-30
---

**Context:** `AGENTS.md` already requires checking whether a dependency can be
updated before designing a workaround, and `plans/rc1-toolchain-upgrades.md`
records the same failure from the `workbox`/`rollup` detour. Second recorded
instance; the rule was in required context both times.

**What happened:** Adding the approved `@astrojs/mdx` broke Svelte's TypeScript
parsing. I diagnosed duplicate physical `acorn` copies under
`node-linker=hoisted`, then designed and verified two workarounds — a
`pnpm.overrides` pin and `pnpm dedupe`. Neither was needed: `svelte` 5.43.5 →
5.56.8, already inside the declared `^5.39.6` range, brought
`@sveltejs/acorn-typescript` 1.0.11 and fixed it.

**Suspected why:** Trigger recognition, not a missing rule. The rule names an
"outdated-dependency problem", but the symptom presented as a package-manager
layout problem, so it did not read as the rule's case. Same shape as
[[live-epic-not-observable]] and [[narrow-criticism-sweeping-rewrite]]: rule
stated abstractly, trigger observed concretely.

**Fix:** Tie the rule to a symptom rather than a diagnosis — when a dependency,
transitive dependency, or package-manager layout is implicated, record
installed-versus-latest before proposing any fix.
