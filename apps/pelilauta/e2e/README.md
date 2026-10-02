# App Feature Regression Suite

This suite drives a browser against a running development server and the shared `skaldbase-test` Firebase project. `pnpm --filter pelilauta test:e2e` executes the suite independently of `pnpm test:uat`. Neither `pnpm test` nor the pre-push hook runs these tests.

Each covered feature defines a dedicated spec file and declares required fixtures. `onboarding-callout-transition.spec.ts` covers callout transitions. The remaining specs each implement one `Scenario:` from `specs/pelilauta/threads/spec.md`, `specs/pelilauta/threads/replies/spec.md`, or `specs/pelilauta/threads/read-state/spec.md`:
- `initial-reply-render.spec.ts`
- `no-profile-author-reads.spec.ts`
- `compose-thread-page.spec.ts`
- `anonymous-visitor-live-reading.spec.ts`
- `resolve-session-after-render.spec.ts`
- `malformed-reply-render.spec.ts`
- `reply-permalink-navigation.spec.ts`
- `latest-reply-navigation.spec.ts`
- `read-opening-post.spec.ts`
- `distinguish-activity-from-publication.spec.ts`
- `inspect-discovery-metadata.spec.ts`
- `preserve-unknown-publication-dates.spec.ts`
- `omit-unknown-structured-data-authors.spec.ts`
- `preserve-chronology-after-an-edit.spec.ts`
- `order-replies-with-equal-creation-dates.spec.ts`
- `re-anchor-a-deleted-reading-target.spec.ts`
- `terminate-a-live-subscription.spec.ts`

`admin.ts` and `signIn.ts` provide shared helpers rather than test specs. `admin.ts` provides `skaldbase-test` Admin SDK access for tests that mutate replies while a page is open. `signIn.ts` performs authentication through the login form. `playwright.config.ts` matches spec files only.

Two scenarios in `specs/pelilauta/threads/replies/spec.md` have no browser regression spec. `Handle initial reply read failure` requires a failed server read. `Handle live update failure` requires a rejected subscription. Because fixtures and browser automation cannot produce either condition, `test/firebase/server/fetchDiscussion.test.ts` covers server read failure instead.

## Prerequisites

The test suite requires two files at the repository root:

- `server_principal.json`: The `skaldbase-test` service account key for `reset-fixtures.mjs`.
- `credentials.ts`: User credentials defining `existingUser`, `newUser`, and `adminUser` objects with `email` and `password` properties. Tests authenticate as `existingUser`.

`apps/pelilauta/.env` provides Firestore configuration.

The Auth account for `existingUser` must exist in `skaldbase-test`. `reset-fixtures.mjs` verifies account existence and aborts execution when the account is missing.

## Running

Start the development server, then run the suite:

```sh
pnpm dev
pnpm --filter pelilauta test:e2e
```

`pnpm --filter pelilauta test:e2e` waits for the server, resets fixtures, and executes Playwright.

`playwright.config.ts` configures `testMatch` to discover only regression specs, using a single worker without retries and retaining traces on failure.

## Fixtures and safety

`reset-fixtures.mjs` restores by explicit document ID only fixture documents required by the regression specs:
- The signed-in member `account` and `profiles` documents.
- One public thread in `stream` for `onboarding-callout-transition.spec.ts`.
- One public thread with two replies authored by the same member (the second carrying an image attachment) for `initial-reply-render.spec.ts`, `compose-thread-page.spec.ts`, `resolve-session-after-render.spec.ts`, `reply-permalink-navigation.spec.ts`, and `latest-reply-navigation.spec.ts`.
- One thread with an author UID lacking a `profiles` document for `no-profile-author-reads.spec.ts` and `omit-unknown-structured-data-authors.spec.ts`.
- One thread with a single reply for `anonymous-visitor-live-reading.spec.ts`. The test publishes a second reply through the Admin SDK. `reset-fixtures.mjs` removes the second reply document on each reset.
- One dedicated thread with one valid reply and one malformed reply document failing `ReplySchema` for `malformed-reply-render.spec.ts`.
- One thread without replies for `latest-reply-navigation.spec.ts`.
- One thread with distinct creation, edit, and activity timestamps and an image attachment for `read-opening-post.spec.ts` and `distinguish-activity-from-publication.spec.ts`.
- One thread lacking creation and edit timestamps for `preserve-unknown-publication-dates.spec.ts`.
- One thread with two attributed replies containing HTML tags and special characters in the body for `inspect-discovery-metadata.spec.ts`.
- One thread whose first reply was edited after the second reply for `preserve-chronology-after-an-edit.spec.ts`.
- One thread with two replies sharing a creation timestamp and one reply lacking a creation timestamp for `order-replies-with-equal-creation-dates.spec.ts`.
- One multi-reply thread exceeding viewport height for the reading-anchor regression spec: `e2e-scroll-boundary-thread` (six replies).
- One thread with a single reply for `terminate-a-live-subscription.spec.ts`.

Before making Firestore requests, `reset-fixtures.mjs` verifies that the service account, `apps/pelilauta/.env`, and `/api/test/firebase-config` all target `skaldbase-test`.
