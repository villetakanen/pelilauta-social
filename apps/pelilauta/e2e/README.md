# Running the end-to-end suite

The suite drives a real browser against a running dev server and the shared
`skaldbase-test` Firebase project. It is not part of `pnpm test` or the pre-push
hook.

## Prerequisites

Two gitignored files at the repository root, never per app:

- `server_principal.json` — the `skaldbase-test` service account, read by the seed
  and cleanup scripts and by `firebase-admin-helper.ts`.
- `credentials.ts` — `existingUser`, `newUser` and `adminUser`, each `{ email,
  password }`. `newUser` is the account `account-registration.spec.ts` registers, so
  `init-test-db.js` deletes its account and profile documents on every seed.

Firestore settings come from `apps/pelilauta/.env`.

## Running

Seed the database, start the server, then run **one spec at a time**:

```sh
NODE_ENV=development node e2e/init-test-db.js
pnpm dev
NODE_ENV=development npx playwright test e2e/<name>.spec.ts --project=chromium
```

Avoid a full run. 19 of the 23 specs sign in by driving the login form through
Firebase Auth, and that sign-in costs more than the assertions it enables — a whole
run takes tens of minutes, where the design system's 77 tests take twelve seconds.
Run the specs your change touches; reach for the full suite only when you are
verifying something that spans the application, such as a toolchain upgrade, and
expect to leave it running.

`e2e/cleanup-test-threads.js` removes threads a failed run left behind.
