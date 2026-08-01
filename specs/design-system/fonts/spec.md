---
status: draft
---

# Fonts

## Blueprint

### Context

`specs/design-system/typography/spec.md` names families and weights. Nothing
delivers them. The faces are declared in `apps/pelilauta/src/overrides.css`, so the
design system publishes a type system it cannot render, and the design site — which
imports no Cyan and no faces — teaches that system in whatever the reader's machine
offers.

A face is a payload, and payload is bought once for both applications. That is a
different decision from what the scale looks like, and it fails differently: a
missing face never errors, it approximates.

### Architecture

Faces are declared in one design-system stylesheet, reached through
`styles/ds.css`. A consuming application declares none. This is the only design-system
stylesheet with package dependencies: Lato comes from `lato-font` and Roboto Mono from
`@fontsource/roboto-mono`, referenced by bare specifier and resolved by each
consumer's bundler.

The design system is consumed as source through a Vite alias, not built, so that
dependency is installed from the workspace root and each application emits and
fingerprints its own copy of every file. There is no shared copy and no third-party
host.

Both registers load faces from here. Neither renders from what the reader's machine
happens to have, and the platform stacks behind both family tokens are a fallback for
a failed load, not a delivery mechanism.

The registers load different amounts, which is where a reader would expect symmetry
and not find it. The human register loads every weight the scale names, because it
sets everything from a title to a caption. The technical register loads only the
weights a technical role uses.

### Constraints

Every weight `specs/design-system/typography/spec.md` names is a loaded upright face
in the human register, and each of them loads its italic: emphasis inside prose is
prose, and a missing italic is synthesised by slanting the upright.

The technical register loads the weights its roles use and no others. No technical
role sets a heading and none takes inline emphasis, so it loads neither the display
weights nor an italic. A technical role that needs one adds a face here first.

The set is otherwise closed the way the step set is — a face is added or dropped by
changing this spec. It holds two weights no step names, kept from the set the
application already shipped; dropping them is a payload decision, not a consequence
of the scale.

Every face swaps rather than blocking. A reader on a slow connection reads the
fallback first.

The family tokens are the design system's to declare, under the names in
`specs/design-system/design-tokens/spec.md`. A consumer reads the token, never a
family name.

## Contract

### Definition of Done

- One design-system stylesheet declares every face, and neither application declares
  one of its own.
- Both applications render both registers from shipped faces, the design site
  included, with no family named in the design site's own editorial stylesheet.
- With every face blocked from loading, both registers still fall to a monospace and a
  sans respectively, and nothing renders in the browser's default serif.
- A check asserts that every weight the typography spec names has an upright face,
  that every declared source resolves to an installed file, and that every face
  swaps. It reads the weights from the typography spec rather than restating them.
- Human review accepts the weight and colour of text on screen in both applications.

### Regression Guardrails

- A weight named with no face renders synthesised. It is approximately right at every
  size and never fails, so nothing surfaces it but a comparison.
- A family named in a stack and never loaded renders correctly on the machine of
  anyone who has that family installed, and differently for everyone else. It cannot
  be caught by looking.
- A face-package upgrade that moves or renames a file breaks a source silently in any
  bundler that tolerates an unresolved `url()`.
- An application that re-declares a face doubles the payload and creates a second
  source of truth that will diverge, not fail.

### Scenarios

```gherkin
Given a weight the typography spec names
When text renders at that weight
Then a loaded face provides it and the browser synthesises nothing
```

```gherkin
Given an application that imports the design system's stylesheet entry point
When any page renders
Then every face is available, and the application declares none itself
```

```gherkin
Given a face that has not finished loading
When the page paints
Then the text is visible in a fallback and swaps when the face arrives
```

```gherkin
Given a reader whose machine has neither family installed
When an identifier, a slug or a code block renders
Then it is set in the technical family, from a face the design system shipped
```
