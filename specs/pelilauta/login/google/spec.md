---
status: live
---

# Google sign-in

## Blueprint

### Context

Readers use a Google account to sign in to Pelilauta.

### Architecture

[SyndicatedLoginSection.svelte](../../../../apps/pelilauta/src/base/client/login/SyndicatedLoginSection.svelte)
provides Google sign-in. [Login](../spec.md) governs shared sign-in completion,
return destinations, and presentation in normal login and protected-document recovery.

## Contract

### Required behavior

Google sign-in shows progress while pending. Cancellation or failure reports that
sign-in did not complete and allows another attempt without navigation.

### Scenarios

```gherkin
Scenario: Cancel Google sign-in
  Given Google sign-in is pending and the page shows progress
  When the reader closes the provider popup
  Then the page reports that sign-in did not complete
  And the reader can start another attempt without navigation

Scenario: Complete Google sign-in
  Given a reader starts Google sign-in with a valid return destination
  When Google authentication succeeds
  Then sign-in proceeds through Login's shared completion contract
```
