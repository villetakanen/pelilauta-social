# The app feature regression suite

One maintained regression, driving a real browser against a running dev server
and the shared `skaldbase-test` Firebase project. `pnpm --filter pelilauta
test:e2e` runs it, independent of `pnpm test:uat` (release acceptance — a
different suite, its own broader reset, untouched by this one). It is not part
of `pnpm test` or the pre-push hook.

Each feature this suite covers gets its own spec and declares the fixtures it
needs; nothing here is a general fixture framework, and nothing from the
retired suite was ported. `onboarding-callout-transition.spec.ts` is the first
and, for now, only one.

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

`playwright.config.ts` pins `testMatch` to
`onboarding-callout-transition.spec.ts`, one worker, no retries, and
`trace: retain-on-failure`, so the command discovers only this regression —
never a legacy spec, never the UAT reset.

## Fixtures and safety

`reset-fixtures.mjs` restores, by explicit document id, only what
`onboarding-callout-transition.spec.ts` reads: the signed-in member's
`account` and `profiles` documents, and one public thread in `stream`. It
refuses to run — before making any Firestore call — unless the service
account, the application's `.env`, and the *running* application (checked live
through `/api/test/firebase-config`) all agree the target is
`skaldbase-test`.
