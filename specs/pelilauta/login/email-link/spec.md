---
status: live
---

# Email-link sign-in

## Blueprint

### Context

Readers sign in through a link sent to their email address, including when they
open the link in another browser.

### Architecture

[EmailLoginSection.svelte](../../../../apps/pelilauta/src/base/client/login/EmailLoginSection.svelte)
provides email-link sign-in. [Login](../spec.md) governs shared sign-in completion,
return destinations, and presentation in normal login and protected-document recovery.

## Contract

### Required behavior

Email sign-in accepts an email address and confirms when the link has been sent.
When sign-in choices render for an email-action visit, completion starts
automatically with the saved email. Without a saved email, completion asks for
the address that requested the link. Request or completion failures report failure
and leave sign-in available.

Email completion preserves the intended return destination even without the
originating browser's saved state. Firebase email-action parameters belong to
link verification, not to the return destination.

### Scenarios

| Starting conditions | Action or event | Expected outcome |
| :--- | :--- | :--- |
| A reader enters an email address. | The reader requests a link and sending succeeds. | The page confirms that the link has been sent. |
| A browser has the saved requesting email and no verified cookie. | The reader opens a valid sign-in link. | Completion starts automatically without asking for the email again and proceeds through Login's shared completion contract. |
| A reader requests an email link with `/sites/example/handouts?view=list#latest` as the return destination. | The reader opens the link in a browser without a verified cookie, saved email, or saved destination and enters the requesting email address. | Successful authentication and cookie exchange navigate to that pathname, query, and fragment without adding Firebase email-action parameters. |
