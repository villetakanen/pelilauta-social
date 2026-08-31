# Acceptance-Testing Seed

The default test data every acceptance run writes after the reset, and the shape
that holds it. The inventory is sourced from v18's seeds —
`apps/pelilauta/e2e/init-test-db.js` and `apps/pelilauta/test/api/init-api-test-db.js`
— corrected against the application's schemas where the two disagree.

## Shape

The seed is JSON under `uat/pelilauta/e2e/seed/`: `account.json`, `profiles.json`,
`sites.json`, `pages.json`, `threads.json`, `replies.json` and `meta.json`, one file
per top-level collection, keyed by document id. Pages and replies are subcollections,
so `pages.json` and `replies.json` key on compound ids (`siteKey/pageKey` and
`threadKey/replyKey`). The seeder splits on `/` to place each document.
`seed/assets/` holds two kinds of binary file: one the seeder uploads itself, and
one a spec uploads through the running application. `seed/assets/provenance.md`
states which is which.

Three placeholder forms keep the files static. `@existingUser`, `@newUser` and
`@adminUser` resolve to the example accounts' uids in Auth, wherever they appear —
as a key, or as a value inside `owners`, `author` or `admins`. `@now` resolves to a
server timestamp on a date field. On a numeric field such as `flowTime`, it resolves
to the current time in milliseconds. `@asset:<filename>` resolves to the download
URL the seeder gets back after it uploads `seed/assets/<filename>` to Storage. The
seeder parses every document with the application's schemas
(`apps/pelilauta/src/schemas/`) before writing, so the seed cannot drift from what
the application reads. The reset wipes only the collections on its list, so outside
them the seed overwrites its documents in place every run.

The schemas overrule the v18 scripts in two places: the account collection is
`account`, not `accounts` (`AccountSchema.ts`), and a profile's avatar field is
`avatarURL`, not `avatarUrl` (`ProfileSchema.ts`).

## Accounts

The three example accounts persist in Auth between runs. The reset only creates a
missing one, from the root `credentials.ts`. The seed gives them their documents.

| Account | `account` document | `profiles` document |
| :--- | :--- | :--- |
| existingUser | yes | yes |
| newUser | none | none |
| adminUser | yes | yes |

newUser stays documentless so the registration journey starts where a new reader
does: signed in, redirected to onboarding.

## The documents

- `account/@existingUser`, `account/@adminUser` — `eulaAccepted: true`,
  `language: "fi"`, `lightMode: "light"`, `frozen: false`, `lastLogin` and
  `updatedAt` at `@now`. Without an accepted EULA, sign-in lands on onboarding.
- `profiles/@existingUser`, `profiles/@adminUser` — a `nick`, a matching
  `username`, `avatarURL: ""`, a one-line `bio`.
- `meta/pelilauta` — `admins: ["@adminUser"]`.
- `meta/threads` — `topics` with authentic forum channels under category
  `Pelilauta`: `yleinen` (`threadCount: 2`), `roolipelit` (`threadCount: 2`),
  `tapahtumat` (`threadCount: 1`) and empty `test-channel` (`threadCount: 0`).
- `stream/kauhupelit-syysiltoina` — a public discussion thread authored and owned by
  `@existingUser` in channel `yleinen`, with `poster` and gallery image
  `seed/assets/cat-pirate-thread.webp`, Finnish markdown content on tabletop horror RPG
  session pacing, `replyCount: 1` and `lovedCount: 0`.
- `stream/ensikertalaisen-pelinjohtaminen`, `stream/sandboxing-ja-heksaryominta`,
  `stream/soolopelaaminen-ja-oraakkelit`, `stream/tracon-2026-peliohjelma` — four
  Finnish discussion threads across `yleinen`, `roolipelit` and `tapahtumat`, providing
  realistic thread volume across the forum channels.
- `stream/kauhupelit-syysiltoina/comments/vastaus-1` — a Finnish discussion reply owned
  by `@adminUser`.
- `sites/gloamroad-company`, `sites/bellweather-knives`, `sites/fallowdeep` —
  three public sites owned by `@existingUser`, one per major campaign-wiki shape:
  a heroic-fantasy quest log, a *Blades in the Dark* crew dossier, and a homebrew
  field archive. Each carries a front page, three character pages, two session,
  score or expedition logs, and two group-agreement pages, cross-linked by
  `[[wikilink]]`. The content is fictional example material, not a fixture
  written for one spec; it gives site navigation, the library listing, page
  rendering and search real content to read rather than placeholder text.
- `sites/bellweather-knives` also carries a `posterURL` and a `backgroundURL`,
  both `seed/assets/bellweather-knives-hero.png`, and one matching entry in its
  `assets` array — one image gives a reading journey a hero, a background and a
  gallery entry already in place.
- `sites/gloamroad-company` also carries `useClocks`, the site option that
  enables rail navigation to site clocks.
- `sites/seed-hidden-site` — a hidden site owned by `@existingUser`, with a front
  page. Every spec that asserts a listing omits hidden sites needs one that
  predates the spec's actions.

`seed/assets/gloamroad-company-upload-fixture.png` is not written by the seed. An
asset-upload spec uploads it through the running application, so the upload
journey exercises a real file rather than a stub.

## Dropped from the v18 seeds

- The cleanup passes — deleting stale threads, pages, reactions and tags. A
  collection a spec writes joins the reset list instead, so nothing survives to
  clean.
- The frozen user and account. No journey exercises freezing yet. The journey that
  does brings its data.
- The cache-header test page and the two sitemap test pages as dedicated
  fixtures. The three seed sites' pages carry those journeys.
- The `accounts` collection write and the admin `version` field, which nothing
  reads.

## Growing the seed

The seed holds what every spec assumes. Data one spec needs, that spec creates.
When several journeys assume the same document, add it here first, then to the
JSON.
