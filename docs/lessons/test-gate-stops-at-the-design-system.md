---
name: test-gate-stops-at-the-design-system
branch: feat/cn-card
date: 2026-08-05
---

**Context:** `.agents/skills/design-system-tests/SKILL.md` states the gate a test
must pass — two artifacts that can drift silently, invisible on the design site,
at least one side read from source — and says a test holding one artifact against
itself is deleted, not fixed. Its description scopes it to "a design-system
change", so nothing routes an application test through it.

**What happened:** `apps/pelilauta/e2e/color-theme.spec.ts:23` asserted
`expect(light.themeLink).toBe(light.references.primary40)`, where the probe's
inline style was `border-color: var(--cn-link)` and `--cn-link` names
`--cn-color-primary-40`. Twenty-five of the file's thirty-four assertions had that
shape, spread across five synthetic probes, and the pattern grew during beta.19
rather than being questioned by it. Removed in this pull request; nine assertions
that read real cascade remain.

**Suspected why:** the gate lives in a skill whose name and description both say
design system, so an agent editing an app e2e file has no reason to load it.

**Fix:** widen the skill — change its `description` to "Decide whether a change
needs a test, and which kind", change "Build a test only when" to name any test in
the repository, and add application e2e to the Browser entry under **The kinds**.
Then the gate is reachable from `apps/pelilauta/e2e` as well as from
`packages/design-system/test`.
