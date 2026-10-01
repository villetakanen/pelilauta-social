# The app feature regression suite

Maintained regressions, driving a real browser against a running dev server
and the shared `skaldbase-test` Firebase project. `pnpm --filter pelilauta
test:e2e` runs them, independent of `pnpm test:uat` (release acceptance — a
different suite, its own broader reset, untouched by this one). It is not part
of `pnpm test` or the pre-push hook.

Each feature this suite covers gets its own spec and declares the fixtures it
needs; nothing here is a general fixture framework, and nothing from the
retired suite was ported. `onboarding-callout-transition.spec.ts` was the
first. The remaining specs each carry one `Scenario:` from
`specs/pelilauta/threads/spec.md`, `specs/pelilauta/threads/replies/spec.md`,
or `specs/pelilauta/threads/read-state/spec.md`, named after it:
`initial-reply-render.spec.ts`, `no-profile-author-reads.spec.ts`,
`compose-thread-page.spec.ts`, `anonymous-visitor-live-reading.spec.ts`,
`resolve-session-after-render.spec.ts`, `malformed-reply-render.spec.ts`,
`reply-permalink-navigation.spec.ts`, `latest-reply-navigation.spec.ts`,
`read-opening-post.spec.ts`,
`distinguish-activity-from-publication.spec.ts`,
`inspect-discovery-metadata.spec.ts`,
`preserve-unknown-publication-dates.spec.ts`,
`omit-unknown-structured-data-authors.spec.ts`,
`preserve-chronology-after-an-edit.spec.ts`, and
`order-replies-with-equal-creation-dates.spec.ts`.

## Prerequisites

Two gitignored files at the repository root, never per app:

- `server_principal.json` — the `skaldbase-test` service account, read by
  `reset-fixtures.mjs`.
- `credentials.ts` — `existingUser`, `newUser` and `adminUser`, each `{ email,
  password }`. The spec signs in as `existingUser`.

Firestore settings come from `apps/pelilauta/.env`.

`existingUser`'s Auth account must already exist in `skaldbase-test`;
`reset-fixtures.mjs` looks it up and refuses if it is missing, but never
creates or deletes an Auth account itself.

## Running

Start the dev server, then run the suite:

```sh
pnpm dev
pnpm --filter pelilauta test:e2e
```

`pnpm --filter pelilauta test:e2e` itself waits for the server, resets the
fixtures, and runs Playwright — so once the server is up, running that one
command is enough.

`playwright.config.ts` pins `testMatch` to the named regression specs, one
worker, no retries, and `trace: retain-on-failure`, so the command discovers
only those regressions — never a legacy spec, never the UAT reset.

## Fixtures and safety

`reset-fixtures.mjs` restores, by explicit document id, only what the named
specs read: the signed-in member's `account` and `profiles` documents; one
public thread in `stream` for `onboarding-callout-transition.spec.ts`; a
second public thread with two replies — the second carrying one image
attachment — in `stream/.../comments`, both authored by the same member, for
`initial-reply-render.spec.ts`, `compose-thread-page.spec.ts`,
`resolve-session-after-render.spec.ts`, `reply-permalink-navigation.spec.ts`,
and the replies half of `latest-reply-navigation.spec.ts`; a thread owned by
an uid with no `profiles` document, for `no-profile-author-reads.spec.ts`; a
thread with one reply, for `anonymous-visitor-live-reading.spec.ts` (which
writes a second reply itself, through the Admin SDK, to simulate another
author publishing while its page stays open — the script deletes that second
reply's document on every reset so the spec starts from its absence); a
thread with one valid reply and one reply document failing `ReplySchema` on
purpose, isolated on its own thread, for `malformed-reply-render.spec.ts`;
a thread with no replies, for the empty-discussion half of
`latest-reply-navigation.spec.ts`; a thread carrying a creation day, a later
edit day, a later activity day and one image attachment, for
`read-opening-post.spec.ts` and
`distinguish-activity-from-publication.spec.ts`; a thread stored with neither
a creation nor an edit date, for
`preserve-unknown-publication-dates.spec.ts`; a thread with two
attributed replies, the second carrying `</script>`, angle brackets and an
ampersand in its body, for `inspect-discovery-metadata.spec.ts`; a thread
whose first reply was created before the second and edited after it, its
stored `flowTime` carrying that edit, for
`preserve-chronology-after-an-edit.spec.ts`; and a thread with three replies
— two sharing one creation date, the first of them edited after every
other date in the thread, and one stored with no creation date, which
`ReplySchema` rejects — for
`order-replies-with-equal-creation-dates.spec.ts`.
`omit-unknown-structured-data-authors.spec.ts` reads the same thread as
`no-profile-author-reads.spec.ts`.

`reset-fixtures.mjs` refuses to run — before making any
Firestore call — unless the service account, the application's `.env`, and
the *running* application (checked live through `/api/test/firebase-config`)
all agree the target is `skaldbase-test`.
