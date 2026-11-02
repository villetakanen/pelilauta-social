---
status: live
---

# MCP page retrieval

## Blueprint

### Context

An assistant needs to find a wiki page, retrieve its current source, and cite it
without mistaking an incomplete listing or backend failure for missing content.

### Architecture

[Read-only site MCP](../spec.md) governs identity, permissions, and resource limits.
[Connection authorization](../authorization/spec.md) governs the verified grant.

## Contract

### Required behavior

Tools return these objects in MCP `structuredContent`; text content may mirror them.

| Tool | Arguments | Successful result |
| :--- | :--- | :--- |
| `list_pages` | Requires `siteKey`; accepts optional `cursor`. | Returns `siteKey`, `pages`, `nextCursor`, and `complete`. Each page contains only `pageKey`, `title`, and `url`. |
| `read_page` | Requires `siteKey` and `pageKey`. | Returns only `siteKey`, `pageKey`, `title`, `markdown`, and `url`. |

The server accepts nonempty stored keys of at most 1,500 UTF-8 bytes containing no `/`.
The server rejects the exact keys `.` and `..`. The server rejects unknown arguments,
invalid keys, and non-string supplied cursors as MCP invalid parameters before content
access. Omitting the cursor starts traversal; empty or malformed cursor strings
return `invalid_cursor`.

The `list_pages` tool returns up to 50 pages in ascending document-ID order. The tool
reads at most 51 page documents and one site per call, excluding grant verification.
The tool returns `complete: true` with a null cursor only at the end of the listing.
Otherwise, the tool returns `complete: false` and a continuation cursor. The cursor
never advances past entries omitted for the result-size limit. The tool returns the
largest ordered prefix that fits; when a single entry cannot fit, it returns `too_large`.

Cursors remain opaque, valid for at most five minutes, and bound to the grant, site,
and position. Refresh preserves cursor validity. A missing site returns `not_available`
before cursor validity. Invalid cursors return `invalid_cursor`. The server rejects
grant and site mismatches. For unchanged documents, continuation returns every page
exactly once. Changes need no snapshot guarantee. Cursors disclose no account metadata.

The tool uses stored `name` strings as titles, document IDs as page keys, and the canonical
page route with encoded stored keys as citations. Invalid required metadata fails a
listing; unrelated body, revision, and presentation fields do not affect listing validity.

A direct read fetches at most one site and one page, excluding grant verification. The
`read_page` tool returns the stored `name` and full `markdownContent` from one snapshot.
An empty string succeeds; a stored document without a string `markdownContent` returns
`failed`. The tool never falls back to HTML, renders Markdown, or chunks bodies. Legacy
pages without Markdown stay unreachable until a member converts them in the browser.
A body that exceeds the result-size limit returns `too_large`.

Tool failures return `isError: true` and `structuredContent` containing only
`error: {code, retryable}`. Failures exclude resource metadata and backend details.

| Code | Meaning | Retryable |
| :--- | :--- | :--- |
| `not_available` | The site or page is missing. | `false` |
| `invalid_cursor` | The cursor is malformed, expired, or bound elsewhere. | `false` |
| `too_large` | The declared result cannot fit within the result-size limit. | `false` |
| `unavailable` | A recognized temporary backend failure prevents retrieval. | `true` |
| `failed` | Another backend or stored-data failure prevents retrieval. | `false` |

### Scenarios

```gherkin
Feature: Find and cite current wiki pages

  Scenario: Find a page and retrieve its source
    Given a reader can read but cannot edit a site's page named "Pohjoinen"
    When the assistant lists the site's pages
    Then the listing includes the page's stored key, title, and canonical URL
    When the assistant reads that key
    Then the assistant receives current Markdown and the same citation without edit access

  Scenario: Continue through a large site
    Given an unchanged readable site has 51 pages that fit the result-size limit
    When the assistant lists its pages and follows the returned cursor
    Then the first result contains 50 pages and is incomplete
    And the second contains the remaining page and marks completion
    And the listing neither omits nor repeats a page

  Scenario: Distinguish an outage from no pages
    Given a temporary backend failure prevents listing a readable site
    When the assistant requests its pages
    Then the tool returns unavailable with retryable: true rather than an empty success
```
