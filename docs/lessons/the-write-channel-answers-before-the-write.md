---
name: the-write-channel-answers-before-the-write
branch: feat/21-0
date: 2026-09-29
---

**Context:** `uat/pelilauta/e2e/sites/create-a-clock-and-step-it.spec.ts` steps a
clock, then reloads to read what the database holds. The reload cancels the Firestore
write still in flight, and no later reload reissues it, so the poll spends sixty
seconds reading the value the step never replaced.

**What happened:** `2573bb41` guarded the race by awaiting a POST to
`/google.firestore.v1.Firestore/Write/channel` before the reload, and recorded that
two full suite runs passed with the wait. The journey failed again on every run. The
page posts its subscriptions to that same channel, so `waitForResponse` returned on a
handshake while the step was still in flight. A browser probe stepped a clock, waited
eight seconds and reloaded: the step persisted. The application write path was never
at fault.

**Suspected why:** the write channel carries subscriptions and mutations on one URL,
so a wait keyed on the URL cannot name which of the two it caught.

**Fix:** a journey that asserts a write reads it from a second page and leaves the
writing page open, as `a50f17bc` now does, rather than waiting on the transport.
