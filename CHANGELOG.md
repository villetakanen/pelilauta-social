# Changelog

This file records Pelilauta releases from 21.0.0-rc.2 onward.

## 21.0.0-rc.4

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
