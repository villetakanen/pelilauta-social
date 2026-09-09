---
status: live
---

# Settings

## Blueprint

### Context

`/settings` gives a logged-in member one place to manage the account, profile, and
session.

### Architecture

`apps/pelilauta/src/pages/settings.astro` is a page of the library. `../spec.md` governs
the layout, the session guard, and the address.
`components/svelte/settings/SettingsApp.svelte` renders the page sections as a single island:

| Section | Purpose | Governed by |
| :--- | :--- | :--- |
| Profile | the profile as other members see it | (implicit) |
| Profile tool | editing the avatar, bio, and links | (implicit) |
| Actions | theme selection and signing out | `actions.md` |
| Sign-in identity | data the sign-in provider passed to the service | (implicit) |
| Remove account | deleting the profile and the account | (implicit) |

A section file carries the Architecture, Constraints, Regression Guardrails, and Scenarios
of one section. This file carries the spec status and page-wide rules.

### Documentation

(implicit)

### Constraints

`src/schemas/AccountSchema.ts` is shared with live v18. A section writes only fields the
schema carries.

## Contract

### Definition of Done

- A logged-in member reaches every section from `/settings`.

### Regression Guardrails

- No section writes an account field the shared schema does not carry.

### Scenarios

```gherkin
Feature: Settings

  Scenario: No session
    Given a visitor without a server-side session
    When the visitor opens /settings
    Then the server sends them to /login with a redirect back to /settings
    And no forbidden page renders

  Scenario: Member data
    Given a logged-in member
    When the member opens /settings
    Then the page shows that member's profile, account, and sign-in identity
    And no other member's data
```
