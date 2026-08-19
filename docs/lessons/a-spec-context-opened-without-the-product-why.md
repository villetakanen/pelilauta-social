---
name: a-spec-context-opened-without-the-product-why
branch: feat/thread-presentation
date: 2026-08-19
---

**Context:** the new colour-system spec was split out of design-tokens with a
Context that described what the capability does and how its layers relate.

**What happened:** the owner read `specs/design-system/color-system/spec.md`
and `docs/DESIGN.md` and judged the whole capability "a technical artefact,
without any real purpose" — deletable without loss. Two rewrites failed the
same test: describing the system, then arguing mechanism benefits. The Context
passed only when its first sentence stated the product promise ("carries
Pelilauta's identity coherently through every surface, and lets a site owner
replace that identity", `specs/design-system/color-system/spec.md:11`).

**Suspected why:** the template asks Context for "the need this capability
serves" but nothing tells the writer the opening sentence must name the
product outcome, so agents open with description or mechanism instead.

**Fix:** add one line to `specs/TEMPLATE.md`'s Context guidance: open with why
the feature is desired — the deletion test: if removing the capability loses
nothing nameable in the first sentence, the why is missing.
