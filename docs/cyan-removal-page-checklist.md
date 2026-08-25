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

The goal is the design language of v19 on the business logic of v18. The Cyan
stylesheets are gone from the application — `BaseHead.astro` imports `ds.css` and Cyan's
Lit components, and nothing else — so a page now renders without them and shows what is
missing. Work in this order.

1. **Compose from the design system first.** Build the page out of what
   `packages/design-system` publishes, and read the spec of a capability before using
   it. Adjust the UX where a published capability takes a shape v18 did not; the
   migration intends that difference. Keep these contracts unchanged: routes, Firestore
   reads and writes, auth, event names, i18n keys, and e2e selectors.
2. **Shim locally where the design system does not reach.** Write one scoped rule in the
   component, under a `@todo` stating what is missing and whether it belongs in the
   design system or stays bespoke here. Anchor the shim in a `plans/debt` file where one
   covers the gap — a listing row anchors to
   `plans/debt/the-design-system-has-no-listing-row.md`. Do not copy a shim into a
   second component without adding that component to the anchor.
3. **Remove the dangling Cyan names last.** Delete a class that declares nothing. Remove
   these names last, because until the page stands on the design system they record the
   layout the page had, and an early deletion loses that record.
4. **Ask the operator on a severe doubt.** Ask, and wait, for a page that cannot be
   composed without changing a contract, for a capability that is wrong rather than
   missing, and for a shape v20 never settled. A guess here canonicalises a wrong model.

State the plan before implementing it: a few technical lines on what to use, what to
shim and what to remove.

### What the layout capabilities provide

A content container places its children in rows of one, two or three columns —
`.content-prose`, `.content-golden`, `.content-triad` — and reaches no deeper than those
children. It states `--cn-line` after itself, so a page may stack containers under one
`<main>` and needs no separation between them. Inside one child, the component states
the interval between its blocks in one scoped rule.

`.app-main` is the page frame: the containment context a container resolves against, the
page-edge inset and the clearance for the app bar. It states no separation.

`.text-prose` is where author-written markdown renders — a thread body, a reply, a wiki
page, a handout. It spaces every standard block at any depth and fits replaced media to
the region. Interface text does not use it.

`.surface` carries the padding under a payload box. Add elevation only where a state
calls for it, never as decoration.

An `astro-island` is `display: contents` and has no box, so a rule placed on it paints
nothing. `content-containers.css` reaches through it to the element it renders.

### Before recording a page

Run `astro check` and `pnpm test`, then open the page on the dev server at 4321 in every
state its row lists. A green suite is not evidence a page renders. Fix what the removal
exposes in the same commit — a missing i18n key, an `<a>` with no `href`, a heading
using the deleted `text-h5`, an `<hr>` that now paints.

Then set the Checked column of the row to `yes`, and add a paragraph for the page to
`docs/cyan-removal-handoff.md`: what it now stands on, and what it leaves open.

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
| Site page | `/sites/mekanismi/<pageKey>` | Prose flow with markup from a real writer — headings, `---`, images | no |
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
(`apps/pelilauta/src/pages/debug/purge.astro:6`). The dump in `ChannelsAdmin.svelte:187`
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
