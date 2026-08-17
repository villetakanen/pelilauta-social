---
name: a-hand-written-fixture-hid-a-live-accessibility-defect
branch: feat/chrome
date: 2026-08-13
---

**Context:** `specs/design-system/chrome-actions/spec.md` makes it an explicit
departure from v20 that a chrome action needs no `aria-label`, because its label names
the control in both presentations. `apps/design/e2e/chrome-actions.spec.ts` was written
to assert exactly that, and mounts its probes as raw HTML strings rather than rendering
the component the book uses.

**What happened:** the probe's icon was hand-written as `<span class="cn-icon"
aria-hidden="true">`. `Icon.svelte:80-88` is deliberately not decorative by default and
emits `role="img"` with `aria-label={noun}`, so `aria-hidden` is what it renders only
when passed `decorative` — a prop `ChromeActionSpecimens.astro` never passed. The
fixture silently supplied the fix production was missing. The check passed while every
chrome action on the shipped book announced `"send Send"` and `"arrow-left Back"`; an
adversarial delivery review found it with `page.accessibility.snapshot()`, after the
check, two spec reviews and four correction rounds had all reported clean.

**Suspected why:** the check and the book were built by different work units against a
written contract rather than against each other, and nothing in
`.claude/skills/design-system-tests/SKILL.md` says a browser check must exercise the
same rendering path as the specimen it corroborates.

**Fix:** add a line to the **Browser (e2e)** entry in
`.claude/skills/design-system-tests/SKILL.md`: a browser check asserting anything about
a component's output mounts that component, or asserts against the book page's
specimen. A hand-written stand-in is allowed only for a plain element with no component
behind it, and any attribute it carries that the component does not emit is a defect.
