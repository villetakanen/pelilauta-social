---
name: design-system-developer
description: Building or changing a design-system component or token.
---

# Design System Developer

A design-system change ships three artifacts: its spec (`spec` skill), its
implementation, and its book (`design-system-book` skill). What it has to verify is
its spec's Contract; where each level checks that, and how the check is written, is
the `design-system-tests` skill. Load it with this one whenever a test file is open.

## What the change has to be for

v21 exists to remove Cyan. A design-system change moves the application off
`@11thdeg/cyan-css`, and the test is a dependency:

**With cyan-css absent, would the application render this correctly?**

Correctly, not identically. A like-for-like claim against what the application renders
today is a defect.

Declaring a token Cyan already declares fails this test. Cyan's value is shadowed in
the cascade while Cyan still supplies the rule that reads it, so the application
depends on Cyan as much as it did before. The surface moves when the design system owns
the rule that reads the token.

## Where design intent comes from

Take the appearance from v20, at `~/dev/pelilauta-20/`. Where it disagrees with the
shipped application, v20 wins: the application still renders v18, and appearance is not
a compatibility contract.

Find v20's answer before writing your own. Its CSS is in
`packages/cyan/src/{tokens,core,layouts,utilities}` **and inline in `.astro` global
style blocks** — search both. Its intent is in its books, under
`app/cyan-ds/src/content/`.

Where v20 is silent or contradicts itself, ask before deciding, and deliver everything
that does not depend on the answer.
