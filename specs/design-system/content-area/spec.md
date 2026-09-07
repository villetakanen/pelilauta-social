---
status: live
---

# Content Area

## Blueprint

### Context

Preflight resets browser defaults across the app. `.content-area` overrides that reset
for site content, to render wiki pages, threads or handouts as documents.

### Architecture

The descendant rules under `.content-area` carry zero specificity, written with
`:where()`, so a component inside the region restyles its children without fighting the
floor.

`.content-area` restores inside the region what `../preflight/spec.md` removes.

### Documentation

`apps/design/src/content/utilities/content-area.mdx` carries the capability's book.

The Spatial System principles book carries the content area as its worked example of
stacked-block rhythm and floor layout.

### Constraints

Standard authored blocks are separated by `--cn-line`, and the region's final block
leaves no trailing separation.

An authored list gains a gutter, so its markers sit inside the region. Authored media
fits the offered width and keeps its ratio.

When a component sets the size of its own image, that size wins inside a content area;
the content area does not resize it.

A teaser that shows authored content as part of a listing deliberately flattens its
descendants instead of applying the content-area floor.

## Contract

### Definition of Done

- The content-area book shows the restored treatment for text, lists, tables and media,
  an override by a nested component, and a deliberately flattened teaser.
- Human review accepts the region at narrow and wide widths and in both colour schemes.

### Regression Guardrails

- Content-area selectors have zero specificity for descendant presentation.
- The region does not alter a nested component's declared layout or spacing.
- The final block in a region has no trailing `--cn-line` separation.
- An audited scaffold list carries `role="list"` where marker removal requires explicit
  list semantics, remains markerless inside and outside the region, and receives no
  automatic document indentation.
- Replaced content stays within the region's offered inline size.

### Scenarios

```gherkin
Feature: Content Area

  Scenario: Block rhythm
    Given a region containing authored paragraphs, a list, a table and an image
    When the region renders
    Then each block follows the document presentation floor
    And adjacent standard blocks are separated by --cn-line

  Scenario: Authored list keeps its markers
    Given an authored unordered, ordered or nested list without role="list" in a content area
    When the list renders
    Then its native markers sit inside the region's gutter
    And its list items have no separation from one another

  Scenario: Interface list stays markerless
    Given a list carrying role="list" inside or outside a content area
    When the list renders
    Then it stays markerless
    And the content area adds no document indentation

  Scenario: Component overrides the floor
    Given a component in a content area that declares its spacing and layout
    When the component renders
    Then its own declarations determine its presentation

  Scenario: Wide media fits the region
    Given an image wider than the content area
    When the image renders
    Then it fits the offered inline size
    And it keeps its intrinsic ratio

  Scenario: Component media keeps its size
    Given a component that sizes its own image in a content area
    When the component renders
    Then the component's size holds

  Scenario: Teaser stays flat
    Given a listing teaser containing authored text
    When the teaser renders
    Then the teaser keeps its flattened presentation
```
