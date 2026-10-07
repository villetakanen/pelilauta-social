---
status: live
---

# HTML Sanitization

## Blueprint

### Context

Members combine Markdown with document HTML. Sanitization preserves supported
document structure while excluding executable markup and application controls
from published content and previews.

### Architecture

The renderer in [Markdown Rendering](spec.md) uses `sanitize-html` after Markdown
parsing and extension expansion, before HTML reaches SSR output or browser
insertion. Server and browser rendering use the same policy. Stored HTML
fallbacks skip Markdown parsing and enter this boundary directly.

### Constraints

Sanitization applies to author-written and extension-generated HTML. Extension
renderers escape interpolated text and attribute values before sanitization.
Sanitization does not rewrite persisted content.

The policy permits the following elements.

| Purpose | Permitted elements |
| --- | --- |
| Paragraphs and headings | `p`, `br`, `hr`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6` |
| Inline text | `em`, `strong`, `b`, `i`, `s`, `del`, `sub`, `sup`, `abbr`, `mark`, `small`, `span` |
| Quotations and code | `blockquote`, `q`, `cite`, `pre`, `code`, `kbd`, `samp`, `var` |
| Lists | `ul`, `ol`, `li`, `dl`, `dt`, `dd` |
| Links and images | `a`, `img`, `figure`, `figcaption` |
| Tables | `table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td` |
| Disclosure | `details`, `summary` |
| Footnote structure | `section` |
| Task-list state | `input`, restricted to disabled checkboxes |

The policy removes scripts, event-handler attributes, inline styles, embedded
frames, SVG, MathML, and custom elements. Form controls other than disabled
checkboxes are excluded. An allowed element does not admit arbitrary attributes,
classes, or identifiers.

The policy permits the following attributes and values.

| Elements | Permitted attributes |
| --- | --- |
| All permitted elements | `title`; `lang`; `dir` restricted to `ltr`, `rtl`, or `auto`. |
| `a` | `href`. |
| `img` | `src`, `alt`, and positive integer `width` and `height`. |
| `ol` | Integer `start` and boolean `reversed`. |
| `li` | Integer `value`. |
| `th`, `td` | Positive integer `colspan` and `rowspan`, and `align` with value `left`, `center`, or `right`. |
| `th` | `scope` with value `row`, `col`, `rowgroup`, or `colgroup`. |
| `details` | Boolean `open`. |
| `input` | `type="checkbox"`, boolean `checked`, and mandatory `disabled`. |
| Dice spans | The classes, data attributes, role, and accessible name defined by `../wiki-dice-notation/spec.md`. |
| Bare-URL anchors | The `url` class on `a`. |
| Footnote structure | The `footnotes` class on `section`. |
| Footnote targets | Document-scoped `id` on `a` and `li`. |
| Footnote links | `aria-label` on `a`. |

`../wiki-dice-notation/spec.md` defines the Dice attributes. The policy admits no
arbitrary classes, identifiers, data attributes, or `target` attributes. Inputs
carry no `name`. GFM table alignment survives through the constrained `align`
attribute without admitting inline styles.

Footnote identifiers have the form `fn-<namespace>-<number>` for a definition
and `fnref-<namespace>-<number>-<occurrence>` for a reference. A namespace is a
nonempty sequence of ASCII letters, digits, and hyphens supplied for the rendered
instance. Numbers and occurrences are positive integers. Reference and backlink
anchors point to these identifiers using fragment URLs. The sanitizer admits
footnote identifiers only for the supplied namespace. Footnote rendering emits
this markup contract regardless of the parser extension's default output.

Links and images permit HTTP and HTTPS URLs, relative destinations, and
fragments. Links also permit `mailto:`. Other URL schemes are rejected.

The policy removes `script`, `style`, `iframe`, `frame`, `frameset`, `object`,
`embed`, `svg`, and `math` elements with their contents. It unwraps other
excluded elements, retaining sanitized text and permitted children. It removes
excluded attributes. An unsafe link loses its destination and retains its label.
An image with a rejected source is replaced by its alt text.

## Contract

### Definition of Done

- Supported document HTML survives sanitization on the server and in previews.
- Disallowed executable markup and URL schemes do not reach HTML insertion.
- Stored HTML fallbacks receive the same policy as rendered Markdown.

### Regression Guardrails

- Sanitization preserves Dice face text and accessible names.
- Sanitization preserves document-scoped footnote references and backlinks.
- Task-list checkboxes remain disabled and cannot submit form values.
- Server and browser sanitization produce identical output for identical input
  and supplied namespace.

### Scenarios

```gherkin
Feature: HTML sanitization

  Scenario: Disclosure markup survives
    Given HTML containing a details element with a summary and an event handler
    When the content is sanitized on the server or in the browser
    Then the details and summary elements remain
    And the event-handler attribute is absent

  Scenario: Stored HTML uses the same boundary
    Given stored HTML fallback content containing a script and a paragraph
    When the content renders
    Then the script and its contents are absent
    And the paragraph remains

  Scenario: Executable link destinations are rejected
    Given an anchor with a javascript: destination
    When the content is sanitized
    Then the output contains no link with that destination

  Scenario: A task-list item remains a read-only indicator
    Given a checked task-list item produced by Markdown rendering
    When the content is sanitized
    Then its checkbox remains checked and disabled
```
