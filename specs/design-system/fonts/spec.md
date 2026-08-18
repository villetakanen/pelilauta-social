---
status: live
---

# Fonts

## Blueprint

### Context

Font loading is built to optimize the user experience, and machine-read page speed.
While the primary goal is in usability and SEO, the chosen model has an additional
privacy benefit for the users: no third-party requests for fonts.

Font swap is used to optimize first-paint bandwidth. The possible layout shift is an
accepted consequence.

### Architecture

(implicit)

### Constraints

Modifying an OFL font creates a Modified Version with its own license obligations.
To account for this, a publisher's subsets are used, when available.

Every weight `specs/design-system/typography/spec.md` names is loaded in Lato,
upright and italic.

Roboto Mono loads only the weights its uses need; a new use adds its face here
first.

Two Lato weights no step names are kept from the set the application shipped;
dropping them is a separate payload decision.

Coverage is latin and latin-ext. Publisher-split files load with the publisher's
`unicode-range`; whole-family files load without one.

Enforcement ends at the stylesheet: preload markup, cache headers and compression
live in the applications, and can change this spec's outcome without touching it.

## Contract

### Definition of Done

- One design-system stylesheet declares every face and names every family. Nothing
  else does — not the reset, not either application, not the design site's editorial
  stylesheet.
- Both applications render both families from shipped faces, the design site
  included.
- With every face blocked from loading, both families still fall to a monospace and a
  sans respectively, and nothing renders in the browser's default serif.
- A check holds the stylesheet, the typography spec, the resolved face files and the
  served licence notices in agreement. It reads the weights from the typography spec
  rather than restating them.
- A base book documents the delivered system.
- Human review accepts the weight of text on screen in both applications.

### Regression Guardrails

- A weight named with no face renders synthesised. It is approximately right at every
  size and never fails, so nothing surfaces it but a comparison.
- A family named in a stack and never loaded renders correctly for anyone who has it
  installed, which includes whoever is looking at the screen.
- A renamed or deleted face file breaks a source silently in any bundler that
  tolerates an unresolved `url()`.
- Two faces of one family and weight declared without `unicode-range`: the later wins
  and the earlier never loads.

### Scenarios

```gherkin
Given a face that has not finished loading
When the page paints
Then the text is visible in a fallback, and swaps when the face arrives
```

```gherkin
Given a reader whose machine has neither family installed
When a code block renders
Then it is set in Roboto Mono, from a face the design system shipped
```
