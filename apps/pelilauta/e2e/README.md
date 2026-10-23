# App Feature Regression Suite

The suite drives Playwright against a running development server and the shared `skaldbase-test` Firebase project. `pnpm --filter pelilauta test:e2e` runs the suite independently of `pnpm test:uat`. Neither `pnpm test` nor the pre-push hook runs these tests.

- `authentication-state.spec.ts` tests session-copy isolation and restoration after logout.
- `onboarding-callout-transition.spec.ts` tests onboarding callout view transitions.
- `reply-subscription-termination.spec.ts` tests reply subscription lifecycles.
- `read-replies-without-javascript.spec.ts` tests reply rendering in the initial document.
- `anonymous-reply-reaction-reads.spec.ts` tests that anonymous readers perform no reaction queries.
- `open-reply-permalink.spec.ts` tests navigation to a reply permalink without JavaScript.
- `jump-to-timestamp.spec.ts` tests navigation to the reply matching a URL timestamp parameter.
- `live-reply-attribution.spec.ts` tests that a live reply inserted between replies preserves author attribution on each reply.
- `stale-session-reads.spec.ts` tests that unconfirmed sessions initiate no subscriptions or reaction reads.
- `read-marking-awaits-subscription.spec.ts` tests that opening a thread marks it read when the subscription arrives after the session confirms.
- `open-inbox-reply-notification.spec.ts` tests that a reply notification in the inbox links to its reply in the thread.
- `session-agreement.spec.ts` tests email return destinations across browsers, cookie reconciliation and logout, verified controls and reads across threads, sites, and the library, administrative presentation, rail login/settings navigation and profile replacement, and identity-independent public thread HTML. Run the development server with `FEATURE_BSKY=true` to include the Bluesky sharing control.
- `protected-recovery.spec.ts` tests protected-document restoration, bounded retries, unavailable tab storage, sign-in fallbacks, private response headers, and resource denial after repair.

## Prerequisites

The suite requires two gitignored files in the repository root:

- `server_principal.json` carries the `skaldbase-test` service account key for `reset-fixtures.mjs`.
- `credentials.ts` defines `existingUser`, `newUser`, and `adminUser` credentials containing `email` and `password`. The suite authenticates as `existingUser`.

`apps/pelilauta/.env` carries Firestore configuration. Enable
`SECRET_FEATURE_FLAG_PASSWORD_LOGIN=true` for the development server.

The `skaldbase-test` project requires an Auth account for `existingUser`. `reset-fixtures.mjs` aborts when the account is missing. `reset-fixtures.mjs` neither creates nor deletes Auth accounts.

## Running

```sh
pnpm dev
pnpm --filter pelilauta test:e2e
```

`pnpm --filter pelilauta test:e2e` waits for the development server, resets test fixtures, and executes Playwright.

The suite targets the development server at `http://localhost:4321`. `astro dev` takes the next free port when port 4321 is busy. Stop running `astro dev` processes before starting the server. A server left running from an earlier session can serve stale state. Restart the development server after a production build; otherwise Vite can return HTTP 504 for stale optimized-dependency URLs.

`playwright.config.ts` limits `testMatch` to the regression specs and configures one worker, zero retries, and `trace: retain-on-failure`.

## Authentication reuse

`authentication.setup.ts` signs in through the password form once per run and
checks that the running app targets `skaldbase-test`. It verifies server agreement
and captures cookies and Firebase IndexedDB persistence. It excludes application
local-storage caches from the saved state and validates restoration in another context.

`helpers/memberSession.ts` restores a copy through Playwright's `setStorageState`
only for tests that request a member session. Default contexts remain anonymous.
Cookies, IndexedDB, and logout mutations remain isolated between contexts.
Browser mutations do not alter the saved template. A worker restart reuses the same template without
another password verification.

The email-action response mocks reuse the setup token response. Only the recovery
test that exercises interactive sign-in submits another real password request.
A complete successful run submits two password-verification requests while retaining
live session cookie exchange, server authorization, and Firestore reads.

The setup stores session credentials in a private operating-system temporary directory,
with mode-0600 files, and removes it after the run or failed setup. It writes no
credentials into the repository or environment variables. Firebase availability
remains a prerequisite. A setup authentication failure stops the run with the
Firebase error instead of starting tests that cannot sign in. The suite adds no
quota retries or authentication bypass.

## Netlify adapter checks

After building the app against `skaldbase-test` and restoring the fixtures, run
`node apps/pelilauta/test/netlify/protected-recovery.mjs` from the repository root.
The checks invoke the generated Netlify function with classified verifier results
and assert recovery status, caching, middleware re-entry, owner denial, and production
password-form exclusion. The script refuses builds targeting another Firebase project.
It routes same-origin SSR fetches through the generated function without a development server. It replaces the verifier only within its Node process and restores it on completion.

## Fixtures and Safety

`reset-fixtures.mjs` restores explicit document IDs required by the suite: the `account` and `profiles` documents for the signed-in member, one public thread in `stream`, a second author profile, three replies to that thread including one reply with an image, one unread reply notification for the signed-in member, a public site with a homepage for session-gate checks, and a second site for owner-denial checks. `reset-fixtures.mjs` aborts before issuing Firestore requests unless `server_principal.json`, `apps/pelilauta/.env`, and `/api/test/firebase-config` on the running application all target `skaldbase-test`.
