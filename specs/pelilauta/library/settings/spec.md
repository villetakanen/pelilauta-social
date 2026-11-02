---
status: live
---

# Settings

## Blueprint

### Context

A member needs to update public identity and control browser sign-in and
continuing assistant access.

### Architecture

[Library](../spec.md) governs the route, layout, and session guard.
[Protected-document recovery](../../session/protected-recovery.md) governs rejected
authentication. `apps/pelilauta/src/pages/settings.astro` serves the page.

| Section | Purpose | Governing capability |
| :--- | :--- | :--- |
| Profile | Displays the public member profile. | (implicit) |
| Profile tool | Edits avatar, bio, and links. | (implicit) |
| Actions | Selects themes and signs out. | [Actions](actions.md) |
| Sign-in identity | Displays sign-in provider data. | (implicit) |
| MCP connections | Inspects and revokes assistant access. | [Connections](mcp-connections/spec.md) |
| Remove account | Deletes the profile and account. | (implicit) |

### Design

The title occupies `content-prose`. Profile, Profile tool, and Actions occupy a
full-width `content-triad`, in that order. Sign-in identity, MCP connections, and
Remove account follow in `content-prose` in that order.
[Content Container Layouts](../../../design-system/content-container-layouts/spec.md)
governs the Medium/Small/Small Triad, measures, spacing, and responsive transition.

## Contract

### Required behavior

A verified member reaches every section. The page displays data only for the verified
account and restricts account writes to fields in
`apps/pelilauta/src/schemas/AccountSchema.ts`.

Until the profile loads, the page hides every section except MCP connections. Loading
and missing-profile notices appear above MCP connection controls in the
`content-prose` column. A missing profile offers a repair link to `/onboarding`.
Connection controls remain usable. Loaded profile sections replace the message.

### Scenarios

```gherkin
Feature: Manage account settings

  Scenario: Open settings without a verified session
    Given a visitor has no verified browser session
    When the visitor opens /settings
    Then the response carries HTTP 401 and non-sensitive recovery content
    And no account sections appear

  Scenario Outline: Preserve section order across layouts
    Given a verified member's profile has loaded
    When the member opens settings in a <layout> container
    Then sections appear in this order
      | Section          |
      | Profile          |
      | Profile tool     |
      | Actions          |
      | Sign-in identity |
      | MCP connections  |
      | Remove account   |
    And the sections contain no data from other accounts

    Examples:
      | layout |
      | wide   |
      | narrow |

  Scenario: Load a missing profile without blocking connection control
    Given a verified member's profile is missing
    When the member opens settings
    Then a missing-profile message links to `/onboarding`
    And MCP connection controls remain available below that message
    And all other sections remain hidden
    When the profile loads
    Then all sections appear in the prescribed order
```
