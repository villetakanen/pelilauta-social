# App Feature Regression Suite

The feature regression suite drives Playwright against a running development server and the shared `skaldbase-test` Firebase project. `pnpm --filter pelilauta test:e2e` runs this suite independently of `pnpm test:uat`. Neither `pnpm test` nor the pre-push hook runs these tests.

Each spec file defines fixtures for one feature regression:

- `onboarding-callout-transition.spec.ts` tests onboarding callout view transitions.
- `reply-subscription-termination.spec.ts` tests reply subscription lifecycles.
- `read-replies-without-javascript.spec.ts` tests reply rendering in the initial document.
- `anonymous-reply-reaction-reads.spec.ts` tests that anonymous readers perform no reaction queries.
- `open-reply-permalink.spec.ts` tests navigating to a reply permalink without JavaScript.
- `jump-to-timestamp.spec.ts` tests navigation to the reply matching a URL timestamp parameter.
- `live-reply-attribution.spec.ts` tests that a live reply inserted between replies leaves every reply under its own author.
- `stale-session-reads.spec.ts` tests that unconfirmed sessions initiate no subscriptions or reaction reads.
- `read-marking-awaits-subscription.spec.ts` tests that opening a thread marks it read when the subscription arrives after the session confirms.
- `open-inbox-reply-notification.spec.ts` tests that a reply notification in the inbox links to its reply in the thread.
- `session-agreement.spec.ts` tests that reloading with a matching session cookie sends no session POST, and that a missing cookie is recreated by one POST.

## Prerequisites

The suite requires two gitignored files in the repository root:

- `server_principal.json` provides the `skaldbase-test` service account key for `reset-fixtures.mjs`.
- `credentials.ts` defines `existingUser`, `newUser`, and `adminUser` credentials containing `email` and `password`. The suite authenticates as `existingUser`.

`apps/pelilauta/.env` provides Firestore configuration.

The Auth account for `existingUser` must exist in `skaldbase-test`. `reset-fixtures.mjs` aborts when the account is missing. `reset-fixtures.mjs` neither creates nor deletes Auth accounts.

## Running

Start the development server and run the suite:

```sh
pnpm dev
pnpm --filter pelilauta test:e2e
```

`pnpm --filter pelilauta test:e2e` waits for the development server, resets test fixtures, and executes Playwright.

`playwright.config.ts` limits `testMatch` to the regression specs and configures one worker, zero retries, and `trace: retain-on-failure`.

## Fixtures and Safety

`reset-fixtures.mjs` restores explicit document IDs required by the suite: the `account` and `profiles` documents for the signed-in member, one public thread in `stream`, a second author's profile, and three replies belonging to that thread, including one reply with an image, and one unread reply notification for the signed-in member. Before issuing Firestore requests, `reset-fixtures.mjs` aborts unless `server_principal.json`, `apps/pelilauta/.env`, and `/api/test/firebase-config` on the running application all target `skaldbase-test`.
