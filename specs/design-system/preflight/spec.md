---
status: live
---

# Preflight

## Blueprint

### Context

Preflight establishes a global style baseline for both applications across browsers.
Preflight resets browser defaults so components and content treatments define presentation
directly. [Andy Bell's modern reset](https://piccalil.li/blog/a-more-modern-css-reset/)
and [Tailwind Preflight](https://tailwindcss.com/docs/preflight) inform the reset.

### Architecture

The design system CSS entry point loads preflight before presentation styles.
Importing tokens alone does not apply the reset.

Scoped content treatments and components replace reset presentation through the cascade
without specificity escalation. [Content Area](../content-area/spec.md) governs document
presentation inside authored content.

Preflight applies theme background and foreground colours to the document so pages without a
containing surface receive the theme. [Surface](../surface/spec.md) governs surface roles
and treatments.

Astro hydration wrappers remain transparent to layout because wrappers occur between layout
containers and authored children.

### Documentation

`apps/design/src/content/base/preflight.mdx` carries the preflight book.

### Constraints

A rule belongs in preflight when it establishes a global reset baseline or corrects a
browser inconsistency across consuming surfaces. A global selector alone does not qualify a
presentation rule for inclusion.

Preflight normalises control inheritance and browser defaults. Preflight does not define
field presentation, form spacing, sizing variants, or interaction treatments.
[Fields](../fields/spec.md) and [Actions](../actions/spec.md) govern control presentation.
Unstyled controls retain native rendering and visible keyboard focus.

Preflight leaves font-family selection to [Fonts](../fonts/spec.md), type treatment to
[Typography](../typography/spec.md), and media constraints to the containing capability.
Preflight leaves scrollbar appearance to the browser.

A textarea without a `rows` attribute has a minimum block size of 10em for multiline entry.
Textareas resize vertically so manual resizing preserves the inline constraints of the
containing layout.

Other opinionated defaults, including pointer cursors, target scroll margins and font
smoothing, require a global baseline rationale. Presence in an upstream reset or earlier
stylesheet does not establish that rationale.

## Contract

### Definition of Done

- Both applications receive the reset through the design system CSS entry point.
- Browser verification demonstrates the scenarios below and records the inspected browsers
  and versions across Chromium, Firefox and WebKit.
- Human review accepts unstyled control usability, visible keyboard focus, and document
  colours in both colour schemes.

### Regression Guardrails

- Preflight declares no custom properties, and every token it reads resolves in both colour
  schemes.
- Preflight preserves the reader's ability to enlarge text.
- Reset presentation permits scoped overrides without `!important` or stronger selectors
  added solely to defeat preflight.
- Browser corrections preserve control operation, keyboard focus, and accessibility
  semantics.

### Scenarios

```gherkin
Feature: Preflight

  Scenario: Global sizing and spacing baseline
    Given either application loads the design system CSS entry point
    When elements and their before and after pseudo-elements render
    Then they use border-box sizing
    And elements, before and after pseudo-elements, backdrops and file-selector buttons have no default margin or padding

  Scenario: Control typography inheritance
    Given an unstyled button, text input, select and textarea inside a text container
    When the controls render
    Then they inherit the container's font family, font size and line height

  Scenario: Textarea baseline supports multiline entry
    Given an unstyled textarea without a rows attribute
    When the textarea renders
    Then its minimum block size is 10em
    And the reader can resize it vertically but not horizontally

  Scenario: Native controls remain usable
    Given controls without component presentation
    When a reader operates them with the keyboard
    Then enabled controls retain their native operation
    And keyboard focus remains visible

  Scenario: Authored lists retain markers
    Given an ordered or unordered list without an explicit list role
    When the reset applies
    Then the list retains its native markers

  Scenario: Interface lists retain semantics
    Given an ordered list, unordered list or menu with role="list"
    When the reset applies
    Then its markers are removed
    And assistive technology can still identify it as a list

  Scenario: Hidden content stays outside layout
    Given an element with the hidden attribute other than hidden="until-found"
    When the reset applies
    Then the element occupies no layout space

  Scenario: Find-in-page can reveal hidden content
    Given a browser supporting hidden="until-found"
    And an element with hidden="until-found"
    When find-in-page reveals that element
    Then the reset does not prevent the browser from revealing it

  Scenario: Scoped presentation replaces reset defaults
    Given authored content with a scoped content treatment
    And a nested component with declared presentation
    When the design system CSS entry point loads
    Then each scope can replace reset presentation through the normal cascade
    And neither scope needs specificity escalation to defeat the reset

  Scenario: Document receives the theme
    Given a page shorter than the viewport without a containing surface
    When either colour scheme renders
    Then the body covers at least the dynamic viewport height
    And the document uses the theme's background and foreground

  Scenario: Hydration wrappers preserve layout
    Given authored children inside an Astro island in a flex or grid container
    When the page renders before and after hydration
    Then the children participate in the container's layout as if the wrapper were absent
```
