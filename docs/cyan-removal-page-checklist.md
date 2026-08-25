# Deprecate Cyan — Page Checklist

Which rendered pages have been through the triage that removed Cyan, and which have
not. State and traps are in `docs/cyan-removal-handoff.md`. Delete this file when the
epic closes.

The app's dev server is pinned to port 4321 (`apps/pelilauta/astro.config.mjs:16`).
Every link below is `http://localhost:4321`. This file lists only rendered pages — the
35 files under `src/pages/api`, `/rss/threads.xml` and `/sitemap.xml` return a
`Response` and have no styling to check.

Dynamic links carry a sample key: a channel and site key that exist in the shared
Firestore, or the e2e seed value where that is all the source names. A seeded key only
resolves after `test:e2e` has seeded. That command does not run in flight, so
substitute a live key.

## Front and session

| Page | Link | States to look at | Checked |
| --- | --- | --- | --- |
| Front page | `/` | Visitor invitation vs. logged-in; `TopThreadsStream`'s `.error` div, still declaring nothing | yes |
| Login | `/login` | Email, syndicated, and the password form behind `SECRET_FEATURE_FLAG_PASSWORD_LOGIN`; `?redirect=` variant | yes |
| Logout | `/logout` | Renders only in transit to `/` | no |
| Create profile | `/create-profile` | Client-only form, empty and in error | no |
| Onboarding | `/onboarding` | Reads the `03-eula` doc; throws if absent | no |
| EULA | `/eula` | Long prose flow, the widest test of the Prose measure | no |
| Settings | `/settings` | Session required; the `SECRET_FEATURE_FLAG_DEBUG` banner | no |
| Search | `/search` | Session required; empty query, results, no results | no |
| Inbox | `/inbox` | Session required; empty vs. populated | yes |
| Library | `/library` | Session required; `locales/{fi,en}/seo.ts:36` still describes characters | no |
| 403 | `/403` | Static | no |
| 404 | `/404` | Static | no |
| Offline shell | `/offline.html` | PWA shell, auto-retry script | no |

## Channels and threads

| Page | Link | States to look at | Checked |
| --- | --- | --- | --- |
| Channel directory | `/channels` | Categories, empty channel, latest-activity row | yes |
| Channel page | `/channels/yleinen` | Thread list, channel card, search box, the `hasError` note | yes |
| Create thread | `/create/thread` | Session required; `?channel=yleinen` prefill; `/channels?error=channels-unavailable` | no |
| Thread | `/threads/test-thread` | Replies, quotes, reactions; a thread with no reply | no |
| Thread editor | `/threads/test-thread/edit` | Editor chrome, the widest form on the site | no |
| Confirm delete thread | `/threads/test-thread/confirmDelete` | Modal; allowed, forbidden, and logged-out arms of `WithAuth` | no |
| Delete reply | `/threads/test-thread/replies/<replyKey>/delete` | Modal; same three arms | no |
| Fork reply | `/threads/test-thread/replies/<replyKey>/fork` | Modal; channel picker | no |
| Tag | `/tags/roolipelit` | Threads and pages sections, each hidden when empty; the no-entries caption | no |

## Sites

| Page | Link | States to look at | Checked |
| --- | --- | --- | --- |
| Site directory | `/sites` | Public listing, empty state | no |
| Site home | `/sites/mekanismi` | Poster, homepage page body | no |
| Site page | `/sites/mekanismi/<pageKey>` | Prose flow with a real writer's markup — headings, `---`, images | no |
| Page editor | `/sites/mekanismi/<pageKey>/edit` | Member required | no |
| Page history | `/sites/mekanismi/<pageKey>/history` | `?revision=` variant | no |
| Delete page | `/sites/mekanismi/<pageKey>/delete` | Modal | no |
| Table of contents | `/sites/mekanismi/toc` | Ordering, empty site | no |
| ToC settings | `/sites/mekanismi/toc/settings` | Owner required | no |
| Assets | `/sites/mekanismi/assets` | Grid, empty state | no |
| Asset | `/sites/mekanismi/assets/<assetName>` | Image and non-image | no |
| Handouts | `/sites/mekanismi/handouts` | Member required; non-members get a raw 403 | no |
| Handout | `/sites/mekanismi/handouts/<id>` | Reader view | no |
| Handout editor | `/sites/mekanismi/handouts/<id>/edit` | Owner required | no |
| Clocks | `/sites/mekanismi/clocks` | Empty vs. populated | no |
| Create clock | `/sites/mekanismi/create/clock` | Modal | no |
| Delete clock | `/sites/mekanismi/delete/clock/<id>` | Modal | no |
| Create handout | `/sites/mekanismi/create/handout` | Modal | no |
| Create page | `/sites/mekanismi/create/page` | Modal; `?name=` prefill | no |
| Members | `/sites/mekanismi/members` | Owner required | no |
| Site options | `/sites/mekanismi/options` | Owner required | no |
| Site settings | `/sites/mekanismi/settings` | Owner required | no |
| Site data | `/sites/mekanismi/data` | Owner required | no |
| Site import | `/sites/mekanismi/import` | Owner required | no |
| Create site | `/create/site` | Client-only form | no |

## Profiles and documents

| Page | Link | States to look at | Checked |
| --- | --- | --- | --- |
| Profile | `/profiles/vN8RyOYratXr80130A7LqVCLmLn1` | Own profile vs. another's; a frozen account | no |
| Doc | `/docs/01-index` | Also `03-eula`, `04-authz`, `70-architecture`, `71-designsystem` | no |

## Admin and developer tools

The `/admin` pages are behind `requireAdmin`; the snackbar and users pages additionally
behind `PUBLIC_SHOW_DEVELOPER_TOOLS`. Session purge has no guard
(`apps/pelilauta/src/pages/debug/purge.astro:6`). `ChannelsAdmin.svelte:187`'s dump
already has `.debug`.

| Page | Link | States to look at | Checked |
| --- | --- | --- | --- |
| Admin home | `/admin` | Admin tools vs. mod tools arm | no |
| Channels admin | `/admin/channels` | The `.debug` dump | no |
| Add channel | `/admin/channels/add` | Form | no |
| Messaging | `/admin/messaging` | Form | no |
| Sites admin | `/admin/sites` | Listing | no |
| Snackbar test | `/admin/snackbar-test` | Every snackbar variant | no |
| Users | `/admin/users` | Listing | no |
| Session purge | `/debug/purge` | Client-only tool | no |
