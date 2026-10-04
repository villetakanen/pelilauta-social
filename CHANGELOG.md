# Changelog

CHANGELOG.md carries Pelilauta releases from 21.0.0-rc.2 onward.

## 21.0.1

- The contract records that version 21 serves pelilauta.social, and that Firestore, Storage and Auth carry production data.
- fix(i18n): A post whose author profile does not resolve displays the anonymous label instead of the key `app:meta.anonymous`.
- fix(threads): A thread page opens a live reply subscription only for an active signed-in session, releases it on sign-out, account change and page departure, and says when live updates fail. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): The server reads a discussion's replies in creation order, and a malformed reply is skipped without discarding the rest. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): A thread page carries its replies, with bodies and attachments, in the initial document, so an anonymous reader reads them without JavaScript. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): An anonymous or unresolved session reads no reaction documents for a thread's replies. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): A thread page names each reply's author in the initial document, resolved on the server, so a reader without JavaScript sees who wrote each reply and the replies trigger no browser profile read. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): A thread page names the opening post's author in the initial document, resolved on the server through a shared server-side fetch helper, so the opening post triggers no browser profile read. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))

## 21.0.0

Pelilauta v21 leaves beta and replaces v18.

## 21.0.0-rc.4

- feat(site-import): An imported page keeps the dates its source file carries, so the site index orders imported pages by authoring date. An import stamps a file that carries no dates.
- fix(site-import): An import writes the site page index once for the whole batch instead of once per page.
- fix(front-page): Returning to the front page through a view transition keeps the welcome section hidden from a signed-in member.

## 21.0.0-rc.3

- fix(threads): A signed-in member sees the chat bar on a thread page without an invitation to join the discussion. ([#149](https://github.com/villetakanen/pelilauta-social/issues/149), [#151](https://github.com/villetakanen/pelilauta-social/issues/151))
- fix(i18n): The magic-link verification prompt, the missing-profile panel in Settings, the empty handout list, and the site import flow read text from the locale files. ([#154](https://github.com/villetakanen/pelilauta-social/issues/154))
- fix(onboarding): Entering a nickname another member holds displays the taken-nickname notice and disables registration. ([#156](https://github.com/villetakanen/pelilauta-social/issues/156))
- fix(reactions): The reaction button fetches the current reaction state from Firestore on mount. ([#157](https://github.com/villetakanen/pelilauta-social/issues/157))

## 21.0.0-rc.2

- feat: Pelilauta publishes the changelog at `/changelog.html`, and the footer version links to it. ([#145](https://github.com/villetakanen/pelilauta-social/issues/145))
- feat(forms): A fieldset displays as a borderless group with even spacing between its fields, and its legend takes the heading style of the surrounding section.
- fix(settings): A member toggles the color theme from the Actions section of Settings and from the header switch.
- fix(front-page): The stream cards float over the poster.
- fix(site): Deleting a site reports success and returns to the library.
- fix(site): The theming settings show the background poster behind the site card and the forms.
