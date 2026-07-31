---
name: ds-work-needs-v20-as-authority
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** Writing the Spatial System book, I established what `--cn-grid`,
`--cn-gap` and `--cn-line` mean by counting which CSS properties each one feeds in
`node_modules/@11thdeg/cyan-css/src` and in `apps/pelilauta/src`.

**What happened:** that method concluded `--cn-line` is a `margin-bottom` unit,
because Cyan 4 uses it that way seven times. It is the vertical rhythm unit — v20's
own book says so in one line, and prose line heights are its multiples. Cyan 4 is the
system v21 replaces, so its usage is not evidence of good design, and a principles
book derived from it would have laundered v18 habits into v21 as rules. The correct
source, `~/dev/pelilauta-20-ds/app/cyan-ds/src/content/principles/units-and-grid.mdx`,
had already written the page.

**Suspected why:** nothing an agent reads before doing design-system work says v20
outranks v18 there, and the installed Cyan 4 is the nearest and most greppable source.

**Fix:** a `ds-developer` skill stating that for design-system work v20 and approved
owner decisions are authoritative and v18/Cyan 4 are not — while v18 remains the
compatibility contract for `apps/pelilauta` behavior, data and routes. The rule is now
in `specs/design-system/principles/spec.md`, but only someone already writing a
principles book will read it. A skill of that name existed on `feat/core-design-tokens`
and was deleted with the branch, so check the reflog before writing a new one.
