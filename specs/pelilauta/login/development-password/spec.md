---
status: live
---

# Development password sign-in

## Blueprint

### Context

Local end-to-end tests use password sign-in instead of an interactive provider or
email-link flow.

### Architecture

[PasswordLoginSection.svelte](../../../../apps/pelilauta/src/base/client/login/PasswordLoginSection.svelte)
provides the test form. [Login](../spec.md) governs shared sign-in completion,
return destinations, and presentation.

## Contract

### Required behavior

The password form requires development mode and
`SECRET_FEATURE_FLAG_PASSWORD_LOGIN=true`; production builds exclude it.

### Scenarios

```gherkin
Scenario: Sign in a local test user
  Given development mode and SECRET_FEATURE_FLAG_PASSWORD_LOGIN=true
  And normal login renders for a signed-out reader
  When the reader submits valid test-user credentials through the password form
  Then sign-in proceeds through Login's shared completion contract

Scenario Outline: Exclude the password form
  Given <environment>
  When normal login renders for a signed-out reader
  Then the password form is absent

  Examples:
    | environment |
    | development mode with SECRET_FEATURE_FLAG_PASSWORD_LOGIN unset |
    | a production build with SECRET_FEATURE_FLAG_PASSWORD_LOGIN=true |
```
