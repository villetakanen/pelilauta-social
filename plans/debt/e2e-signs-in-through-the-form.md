# The e2e suite signs in through the login form, once per spec

`apps/pelilauta/e2e` has 23 spec files, 19 of which authenticate by driving the real
login form through Firebase Auth in `e2e/authenticate-e2e.ts`. The sign-in costs more
than the assertions it enables: lines 32, 44, 61 and 69 are fixed `waitForTimeout`
calls totalling 7.5 seconds, followed by a `networkidle` wait at line 37 and a
60-second post-login wait at line 109 — paid per spec, three workers deep. A full run
takes tens of minutes. `apps/design`'s 77 Playwright tests take twelve seconds.

The passwords are the second cost. Three accounts in `skaldbase-test` are reachable
only through a gitignored `credentials.ts`, which existed on one machine and was
restored by hand; `e2e/README-thread-labels.md` still prints the admin login in the
clear. v20 does not have this problem: `pelilauta-20/app/pelilauta/e2e/fixtures/auth.ts`
mints a session cookie from a uid through a dev-only route behind
`SECRET_e2e_seed_secret`, and its history shows it was built that way from the first
auth commit rather than converted later.

This suite is v18's, and it is the only end-to-end coverage v21 has until it is
replaced. Until then, `apps/pelilauta/e2e/README.md` states how to live with it: seed,
start the server, and run one spec at a time.

## Remaining change

Port v20's `src/pages/api/test/seed-session.ts` and its `loginAs` fixture, and reduce
`authenticate-e2e.ts` to a call on it. That retires the three passwords and the root
`credentials.ts` with them, and takes the suite off the login form's timing.

It changes authentication behaviour on a surface v21 shares with live v18, and adds a
route that mints sessions, so it needs the owner's approval and its own epic. Not
expected before 21.0.0.
