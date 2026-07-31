---
name: no-skill-for-reversing-a-feature
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** Specifying a v21 surface means establishing it from two existing
implementations — what v18 ships and what v20 designed, which may already contain the
replacement. Nothing in the harness says how, so `spec` starts from whatever the agent
happened to look at.

**What happened:** the preflight spec claimed v20 owned no document reset, because the
search covered `pelilauta-20-ds/packages/cyan/src/tokens` and `core` and stopped there.
The rules were in `layouts/AppShell.astro`'s `<style is:global>` block with the
element half in `tokens/typography-semantics.css`, and the owner had to say "v20 must
have a reset" twice before it was found. The same session also read
`plans/typography.md`'s claim that the `--cn-*-ui` family is defined nowhere — four of
the five are in `cyan-css/src/tokens/buttons.css` — so a search that stopped early had
already been written into a plan and inherited.

**Suspected why:** the design system's own layout means CSS lives in `.astro` global
blocks as readily as in `.css` files, and nothing tells an agent to look there.

**Fix:** a skill that establishes a surface before it is specified, in a fixed order:
v18 as shipped, then v20 everywhere it might be — `packages/cyan/src/{tokens,core,
layouts,components,utilities}`, the v20 app's own global styles, and the v20 books
under `app/cyan-ds/src/content/principles/` — then the disagreements sorted into
contracts and appearance, then provenance for every claim, since the checkout is a
moving reference. `spec` consumes its output instead of improvising it.
Related: [[ds-work-needs-v20-as-authority]], [[no-fabricated-provenance]].
