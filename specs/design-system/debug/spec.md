---
status: live
---

# Debug utility class

## Blueprint

### Context

The developers, testers and designers of the app need to identify the
feature-flagged, dev-environment-only components.

### Architecture

The theming mechanism of the app changes an element's theme by swapping
either color scale (primary or surface). Below
`:root` this holds only because the generated role stylesheets emit on
`:root, .debug`: a custom property resolves its `var()` references where it is
declared, so without that selector arm a class-level chroma swap reaches
nothing.

The `.debug` utility class changes the surface scale to rowan, a clearly
identifiable scale that is this capability's private chroma decision. Its
stylesheet is not part of `ds.css`: a consumer loads it only in its dev
server, so a production build carries neither the class nor the scale.

### Documentation

None.

### Constraints

(implicit)

## Contract

### Definition of Done

- Inside a `.debug` element the semantic roles resolve through rowan; outside
  it, through the theme.
- In a production build, a `.debug` element renders like any other.

### Regression Guardrails

- The generated role stylesheets keep the `.debug` selector arm; with `:root`
  alone the utility stops re-theming while every suite stays green.
- The swap covers the complete 13-step scale; a missing step half-themes the
  subtree silently.
