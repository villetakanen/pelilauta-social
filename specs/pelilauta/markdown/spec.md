---
status: live
---

# Markdown Rendering

## Blueprint

### Context

Members publish Markdown in discussions and site documents. Readers receive
consistent interpretation across published bodies, previews, snippets, and feeds.

### Architecture

One server- and browser-compatible entry point configures parsing and extensions
for thread bodies, replies, wiki pages, previews, rich snippets, RSS bodies, and
handout HTML. Only that entry point and its private extensions import `marked`
at runtime. Callers supply content, origin, optional site identity and attachment
references, and supported options; they cannot configure parsing or extensions.
Snippet truncation and feed serialization follow rendering and retain its options.
Repository-authored changelog content may use a separate configuration.

[HTML sanitization](html-sanitization.md) governs output and stored HTML fallbacks.
`specs/editor/spec.md` governs authoring;
`specs/design-system/content-area/spec.md` governs presentation.
`../wiki-dice-notation/spec.md` defines Dice syntax and markup;
`specs/dice/spec.md` defines its appearance.

### Constraints

The dialect is GFM with single-newline breaks inside paragraphs on every surface.
Profile references and Dice apply application-wide. Boolean options `footnotes`
and `hashtags` default to `false`: enabling them renders footnotes or tag links;
disabling them leaves their notation literal. Disabled footnotes cannot become
Markdown reference links or wiki shortcuts. Options do not alter headings or code.

Footnote references and backlinks stay within a namespace unique to each rendered
document instance. Server and browser renders of one instance reuse its namespace;
simultaneous previews or copies use distinct namespaces.

Site links and attachments require site context. Without it, their notation stays
literal, attachments generate no image or link, and ordinary Markdown destinations
remain subject only to sanitization.

Syntax extensions preserve inline and fenced code and never insert markup into
link destinations. Rendering preserves Finnish, Swedish, and English characters,
including link labels and code. It changes neither persisted content nor public
URL routes.

### Application syntax

Hashtags recognize a maximal nonempty sequence of Unicode letters, decimal digits,
`_`, `-`, `&`, and `+` after `#`. The marker follows the start of prose, whitespace,
or one of `(`, `[`, `{`, single quote, or double quote. The identifier ends before
whitespace, punctuation outside its character set, or the end of prose. Its visible
spelling stays intact; its lowercased, URL-encoded identifier forms
`<origin>/tags/<identifier>`.

Profile references recognize a maximal nonempty sequence of ASCII letters, digits,
U+00C0–U+017F, `_`, and `-` after `@`, at the start of prose or after whitespace.
Visible spelling stays intact; the lowercased, URL-encoded identifier forms
`<origin>/profiles/<identifier>`. A following dot and letter rejects the whole
candidate, including partial prefix matches. Email addresses never convert.

Markdown block and link parsing precedes hashtag and profile recognition, which
excludes code, raw HTML, existing link labels, and link destinations.

With site context, defined Markdown references precede wiki shortcuts. Unresolved
`[Page Name]`, `[[Page Name]]`, and `[[Page Name|label]]` use the supplied site;
`[[site/Page Name]]` selects another site. Wiki destinations trim and lowercase site
and page names, replacing runs of whitespace and slashes within a page name with
hyphens.

Ordinary Markdown links with site context preserve destinations starting with `/`,
`./`, `../`, `#`, or `?`, or carrying a URL scheme, subject to sanitization. Other
destinations resolve as wiki names: a slash separates site from page; without one,
the supplied site applies.

With site context, `attach:<name>` matches an exact attachment name, extending to
whitespace, `<`, or end of prose. Images use the asset URL with filename alt text;
other files use that URL with the filename as link text. Missing files link the
original notation to `<origin>/sites/<siteKey>/add/asset?name=<encodedName>`.
An absent attachment list is empty. Recognition excludes code, raw HTML, existing
links, and image destinations.

An anchor whose visible text equals its destination receives `class="url"`, whether
it originated as a GFM autolink or an explicit Markdown link. The marker preserves
the complete label and destination; descriptive links do not receive it.

## Contract

### Definition of Done

Identical source, options, and context produce identical renderer output across
surfaces and between server and browser, before truncation or serialization.
Equivalent context requires the same origin, the same site identity and attachment
references (or neither render having site context), and the same footnote namespace
when footnotes are enabled.

### Regression Guardrails

A render for one origin or site cannot affect subsequent renders for another.

### Scenarios

```gherkin
Feature: Markdown rendering

  Scenario: Publication and preview agree
    Given identical Markdown, options, and context
    When a published body and its preview render
    Then their renderer output is identical

  Scenario: Rendering does not leak site context
    Given a site document has rendered
    When attach:map.png renders without site context
    Then attach:map.png remains literal
    And no image or link inherits the previous site's context

  Scenario: Footnotes remain local to each body
    Given two bodies containing the same footnote label with footnotes enabled
    When both appear on one page
    Then their anchors have distinct identifiers
    And each reference and backlink targets its own body
```
