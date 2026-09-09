# Settings: Actions

The Actions section of `spec.md` governs theme selection and signing out.

## Architecture

The section is `components/svelte/settings/Actions.svelte`.

The theme is `lightMode` on the account (`dark` or `light`), written by both
`components/svelte/app/AppThemeSwitch.svelte` and this section. Both controls call `setTheme`,
synchronising state across surfaces through the account atom. The function sets the
document root's `color-scheme`, sets the atom that `ThemeScript.astro` reads before first
paint, and writes the field to the account document.

The control is `CnToggle`, governed by `../../../design-system/components/cn-toggle/spec.md`.
Checked means `light`.

The sign-out button executes `logout` from the session store, then sends the member to the
front page. It does not go through the `/logout` page.

## Constraints

- An account without `lightMode` shows the toggle in the scheme the page is painted in.
  A flip writes an explicit value. No write occurs before the member acts.
- A flip applies at once without a save step.
- A failed write reverts the root and the atom to the last confirmed account and reports
  through the snackbar with `app:errors.themeNotSaved`. Only the latest flip may revert.

## Regression Guardrails

- Both controls write `lightMode` and no other field or storage path.
- The toggle never shows a scheme the page is not painted in.

## Scenarios

```gherkin
Feature: Settings actions

  Scenario: Theme unset on the account
    Given a logged-in member whose account carries no lightMode
    And a browser preferring dark
    When the member opens /settings
    Then the toggle is unchecked
    And the account document is unchanged

  Scenario: Theme flipped
    Given a logged-in member on /settings
    When the member flips the toggle
    Then the page paints the other scheme at once
    And lightMode on the account document carries that scheme
    And the bar's switch shows the same scheme

  Scenario: Theme write fails
    Given a logged-in member on /settings
    When the write of lightMode fails
    Then the page paints the last confirmed scheme
    And the snackbar reports the failure

  Scenario: Sign out
    Given a logged-in member on /settings
    When the member activates sign out
    Then the session, the Firebase sign-in, and the session cookie are cleared
    And the member lands on the front page
```
