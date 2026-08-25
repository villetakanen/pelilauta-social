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

## How to patch a page

The inbox (`010889aa`), the channel directory (`c90fe8bf`) and the channel page
(`cea1240c`) settled the method. Follow it per page.

1. **Census the markup.** Grep the page and every component it renders for class
   names, and resolve each against the published stylesheets. A name that declares
   nothing goes; it is not replaced by another atomic, because the vocabulary has
   none. Cyan is the inventory of what goes, never a source for what replaces it.
2. **Give each payload a content container, and let the page sequence them.** A
   single flow takes `.content-prose`, a flow with one secondary beside it
   `.content-golden`, three peers `.content-triad`: the channel directory is Prose,
   the channel page Golden because its channel card is the secondary. A page may
   stack containers in different modes — the spec calls `.app-main` the host for a
   sequence of them, and the host states the `--cn-line` between siblings — so two
   containers under one `<main>` is the composition working, never a defect to
   collapse. What is a defect is a box between a container and its payload: the
   inbox's `<section>` swallowed the rhythm the container states.
3. **State the rhythm where it belongs.** A content container separates the payloads
   it places by `--cn-line`, and reaches no deeper. Inside one payload, the component
   states the interval between its blocks, in one scoped rule on the box that holds
   them, so a list needs no rhythm class and a row no margin.
4. **Check that the container's rules reach the payload.** An `astro-island` is
   `display: contents`, so it has no box: a rule placed on it paints nothing, and
   the island's own children are what the container must reach.
   `content-containers.css` carries that arm for a Prose child (`:56`) and for a
   Golden or Triad child (`:102,104`), so a container wrapping an island works. It
   carries no such arm for `.app-main > *`, so a hydrated container gets no rhythm
   from its host. Where a page hits a missing arm, fix the stylesheet rather than
   the page.
5. **Stand each payload box on `.surface`.** The surface carries the padding. Add
   elevation only where a state calls for it — the inbox's unread row takes
   `elevation-3` — never as decoration.
6. **Write the missing layout locally, and mark it.** Where no published capability
   offers the shape, write one scoped rule in the component, under a comment marking
   it as a v21 stopgap, not the design language. Anchor it in a `plans/debt` file when
   one covers the gap; listing rows anchor to
   `plans/debt/the-design-system-has-no-listing-row.md`. Do not copy a stopgap into a
   second component without adding it to the anchor.
7. **Fix what the removal exposes, in the same commit.** Look for a missing i18n
   key, an `<a>` with no `href`, a heading reaching for the dead `text-h5`, an
   `<hr>` painting for the first time. E2e selectors follow the markup even though
   the suite does not run.
8. **Look at the page.** Run `astro check` and `pnpm test` first, then the page on the
   dev server at 4321 in every state the row lists. A green suite is not evidence a
   page renders.
9. **Record it.** Set the row's Checked to `yes`, and add the page's paragraph to
   `docs/cyan-removal-handoff.md` — what it now stands on, and what it left open.

A JSX-style `{/* */}` comment inside a Svelte template parses as an expression and
breaks the component; `astro check` catches it.

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
