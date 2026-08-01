---
name: ownership-tables-are-not-checked-for-holes
branch: feat/ds-typography
date: 2026-08-01
---

**Context:** two runs of the same experiment — "implement the smallest change that is
visible to users, per the typography spec" — both edited
`packages/design-system/styles/docs.css`, the design site's editorial stylesheet, to
change which font the books render in.

**What happened:** `docs.css` was the only thing declaring `body { font-family }`, so
it was what an agent found and edited. It declared it because `styles/preflight.css`,
which owns `body`, declared none. The preflight declared none because its spec's
Boundaries table splits type between "the reset" (box model, document, body) and
"typography" (type sizes, leading, heading wrap, link colour) — and *family* appears in
neither row. The preflight already applied `--cn-font-family-mono` to code elements
while the table said nothing about families at all, so the stylesheet was already
outside its own partition and nothing noticed.

`preflight.test.ts` asserts the stylesheet's selector list equals the one the spec
enumerates. It does not assert that the concerns those rules cover are the concerns
the Boundaries table assigns. A selector-level check cannot see a missing row.

**Suspected why:** an ownership table reads as a partition but is authored as a list.
Nothing establishes that its rows are exhaustive over what the stylesheet actually
declares, so a concern that belongs to nobody looks the same as one deliberately left
out. The agent-side symptom is separate and worth its own note: an implementation
lands in whichever file currently wins the cascade, because that is the file the
symptom points at.

**Fix:** the instance is fixed —
`specs/design-system/preflight/spec.md` gains a family row and says why family is the
reset's while sizes are typography's. Two candidates for the mechanism, neither done:
extend `preflight.test.ts` to check declarations against the Boundaries table rather
than selectors against the enumeration; and consider whether other specs with an
ownership table have the same unchecked hole. `delivery-review` gained a **Placement**
challenge for the agent-side symptom. Related: [[agents-write-models-not-anchors]].
