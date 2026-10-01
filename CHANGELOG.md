# Changelog

CHANGELOG.md carries Pelilauta releases from 21.0.0-rc.2 onward.

## 21.0.1

- The contract records that version 21 serves pelilauta.social, and that Firestore, Storage and Auth carry production data.
- fix(threads): A thread page carries the opening post author name and profile link in the initial response, before browser scripts run. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(i18n): A post whose author profile does not resolve displays the anonymous label instead of the key `app:meta.anonymous`.
- fix(threads): A thread page carries every reply, with its body, attachments and author name, in the initial response, before browser scripts run. ([#165](https://github.com/villetakanen/pelilauta-social/issues/165))
- fix(threads): A reply that fails to parse no longer takes down the thread page. The discussion displays the replies it can read and states that it is incomplete.
- fix(threads): Reading a thread without signing in opens no Firestore subscription.
- fix(threads): A reply body renders through the same converter as a thread body, so both support footnotes.
- fix(threads): A link to a thread discussion reaches the discussion. Thread lists, the front page and notifications target `#discussion`, which the thread page now carries.
- fix(threads): A reply displays a permalink on its timestamp, and the reply count on a thread page reaches the latest reply. Both work without browser scripts.
- fix(threads): A thread page distinguishes when the opening post was published, when it was edited, and when the discussion was last active. A date the record does not carry displays nothing, where the page previously displayed the time of the read.
- fix(threads): A thread page carries discussion structured data describing the conversation a reader sees, its authors and its dates.
- fix(threads): A discussion reads in the order the replies were written, and keeps that order when a reply arrives or is edited while the page is open. A reply the server sent and a reply arriving live now sort the same way.
- fix(threads): A reply stored without a creation time reports as incomplete content instead of appearing in an arbitrary place in the discussion.

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
