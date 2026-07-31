---
name: production-outcome-rule-too-narrow
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `AGENTS.md` requires each delivery loop to "start with one observable
production outcome in a named target application", and treats a day without a
"production-integrated slice" as a re-scope gate.

**What happened:** planning the Foundations story, I read that rule as forcing a
change to `apps/pelilauta`, and offered the owner three options on that basis. The
owner called the rule over-engineered: the goal is a tangible deliverable to
*either* application — the design site counts — aimed at end-user benefit rather
than meta-value. The story as built ships a book to design.pelilauta.social and
touches the product app only incidentally.

**Suspected why:** the rule names "production" and "target application" without
saying that `apps/design` is one, so a reader defaults to the product app.

**Fix:** say which applications count and what tangible means. The distinction
worth keeping is end-user benefit versus meta-value, not product app versus design
site — a design-system book is a deliverable, a refactor with no reader is not.
Related: [[over-planning]], since a rule read this way pushes work toward
prerequisite scaffolding.
