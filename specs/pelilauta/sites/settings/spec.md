---
status: live
---

# Site settings

## Blueprint

### Context

An owner manages site details, theming, index, and deletion at `/sites/{siteKey}/settings`.

### Architecture

`apps/pelilauta/src/pages/sites/[siteKey]/settings.astro` is a page of the site.
`../spec.md` governs the layout and the address. `requireSiteOwner` answers a reader who is
not an owner before the page renders.
`components/svelte/sites/settings/SettingsApp.svelte` renders the sections as a single
island.

| Section | Purpose | Governed by |
| :--- | :--- | :--- |
| Site details | name, description, game system, asset licence, and hiding the site | (implicit) |
| Theming | the poster and the background image | `theming.md` |
| Index | rebuilding the table of contents from the pages | (implicit) |
| Delete site | deleting the site and its content | (implicit) |

### Design

The page title and the sections stack in a `content-prose` container in table order.
Theming breaks out of the measure to the container width. Delete site sits closed behind
a disclosure.

### Constraints

`src/schemas/SiteSchema.ts` is shared with live v18. Site writes use only fields the schema
carries.

## Contract

### Definition of Done

- An owner reaches every section from `/sites/{siteKey}/settings`.
- A reader who is not an owner receives no section on the server.

### Regression Guardrails

- No section writes a site field the shared schema does not carry.

### Scenarios

```gherkin
Feature: Site settings

  Scenario: No session
    Given a visitor without a server-side session
    When the visitor opens /sites/{siteKey}/settings
    Then the server sends the visitor to /login with a redirect back to /sites/{siteKey}/settings

  Scenario: Not an owner
    Given a logged-in member who is not an owner of the site
    When the member opens /sites/{siteKey}/settings
    Then the server answers 403 and renders no section

  Scenario: Owner
    Given a logged-in owner of the site
    When the owner opens /sites/{siteKey}/settings
    Then the sections stack in this order:
      | Section      |
      | Site details |
      | Theming      |
      | Index        |
      | Delete site  |
```
