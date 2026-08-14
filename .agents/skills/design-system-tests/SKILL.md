---
name: design-system-tests
description: Writing, changing or pruning a design-system test. Use alongside design-system-developer whenever a test file is open.
---

# Design System Tests

The spec's Contract states what has to hold. This states where each level checks
it, and how the check is written.

## Levels

A level checks only what the level below cannot.

| Level | Tool | Subject |
| :--- | :--- | :--- |
| Lint | Biome, CSS plugins included | a rule binding every file, so a new file is born covered |
| Unit | vitest | a TypeScript function |
| Component | Playwright, against the book page | markup, cascade, container queries, the accessibility tree |
| Visual | the book page, read by a human | anything that can be seen |

## Rules

Check the real component, or the real page. Hand-typed markup standing in for a
component checks the stand-in.

Run a check twice only where the second run can give a different answer. A colour
resolves per scheme; geometry and an accessible name resolve once.

An accessible name is a component assertion. Accessibility is a subject, not a
level.

A consistency check between two of our own documents belongs at the Lint level.
Where it does not fit there, one document generates the other.
