---
status: live
---

# Settings

## Blueprint

### Context

A logged-in member manages the account, profile, and session at `/settings`.

### Architecture

`apps/pelilauta/src/pages/settings.astro` is a page of the library. `../spec.md` governs
the layout, session guard, and address.
`components/svelte/settings/SettingsApp.svelte` renders the page sections as a single island.

| Section | Purpose | Governed by |
| :--- | :--- | :--- |
| Profile | the profile as other members see it | (implicit) |
| Profile tool | editing the avatar, bio, and links | (implicit) |
| Actions | theme selection and signing out | `actions.md` |
| Sign-in identity | data the sign-in provider passed to the service | (implicit) |
| Remove account | deleting the profile and the account | (implicit) |

### Design

The page title occupies a `content-prose` container. The Profile, Profile tool, and
Actions sections follow in a `content-triad` container, in that order. Sign-in identity
and Remove account follow the Triad in a `content-prose` container.

The page offers its full content width to the Triad container.
[Content Container Layouts](../../../design-system/content-container-layouts/spec.md)
governs column measures, spacing, centring, and the transition to a single column.

```text
          +--------------------------------------------+
          | Page title                                 |
          +--------------------------------------------+

+--------------------------+ +----------------+ +----------------+
| Profile                  | | Profile tool   | | Actions        |
|                          | |                | |                |
+--------------------------+ +----------------+ +----------------+

          +--------------------------------------------+
          | Sign-in identity                           |
          +--------------------------------------------+

          +--------------------------------------------+
          | Remove account                             |
          +--------------------------------------------+
```

Loading and missing-profile messages occupy the Prose column in place of the sections.

### Constraints

`src/schemas/AccountSchema.ts` is shared with live v18. Account writes use only fields
the schema carries.

## Contract

### Definition of Done

- A logged-in member reaches every section from `/settings`.
- The page preserves section order when the Triad changes between three columns and
  one column.

### Regression Guardrails

- No section writes an account field the shared schema does not carry.

### Scenarios

```gherkin
Feature: Settings

  Scenario: No session
    Given a visitor without a server-side session
    When the visitor opens /settings
    Then the server sends the visitor to /login with a redirect back to /settings

  Scenario: Member data
    Given a logged-in member
    And the member's profile has loaded
    When the member opens /settings
    Then the page shows that member's profile, account, and sign-in identity
    And the page shows no other member's data

  Scenario: Sections in a wide container
    Given a logged-in member whose profile has loaded
    And the settings content area accommodates the Triad row
    When the member opens /settings
    Then the page title appears in a Prose column
    And Profile, Profile tool, and Actions appear side by side in the Triad
    And Profile occupies the Medium column
    And Profile tool and Actions occupy the Small columns in that order
    And Sign-in identity and Remove account stack in a Prose column below the Triad

  Scenario: Sections in a narrow container
    Given a logged-in member whose profile has loaded
    And the settings content area cannot accommodate the Triad row
    When the member opens /settings
    Then the sections stack in this order:
      | Section          |
      | Profile          |
      | Profile tool     |
      | Actions          |
      | Sign-in identity |
      | Remove account   |
    And the first three sections fill the width offered to the Triad
    And the remaining sections retain the Prose layout

  Scenario: Profile loading
    Given a logged-in member whose profile has not loaded
    And the service has not reported the profile missing
    When the member opens /settings
    Then a loading indicator occupies the Prose column below the page title
    And the settings sections do not render
    When the profile loads
    Then the settings sections replace the loading indicator

  Scenario: Profile missing
    Given a logged-in member whose profile is missing
    When the member opens /settings
    Then a missing-profile message occupies the Prose column below the page title
    And the message offers a repair link to /onboarding
    And the settings sections do not render
```
