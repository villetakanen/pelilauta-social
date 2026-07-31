---
name: corrections-over-steer-into-prohibitions
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** Three separate over-corrections were found and reversed on this branch
in one day, each having caused the opposite of the problem it was written to solve.

**What happened:** `140720c` meant to keep technical detail out of specs and removed
the Blueprint third of the anatomy, so the shape of a thing had no durable home —
plans are transient, and the principles spec could not say how to write a principles
book. `94cd036` recorded the book mechanism it had just built as a rule in
`AGENTS.md`, and every agent then correctly obeyed it and produced `.astro` inventory
books. The lessons practice answered a bad consolidation with "findings are never
merged", which I quoted back at the owner when they asked me to tidy the list. Each
began as a real incident, was written as a general prohibition, and outlived the
incident with nobody re-reading it.

**Suspected why:** a prohibition is the cheapest thing to write when something goes
wrong, and nothing in the loop ever re-reads a rule to ask whether its cause still
exists.

**Fix:** when writing a rule in reaction to an incident, state the incident in the
same sentence — "because X happened" — so a later reader can check whether X still
holds and delete the rule when it does not. `retro` already says to propose removing
a false rule before adding a caveat; the gap is that nothing prompts the check.
Related: [[asdlc-audit-has-no-coherence-check]], which is the pass that could ask it.
