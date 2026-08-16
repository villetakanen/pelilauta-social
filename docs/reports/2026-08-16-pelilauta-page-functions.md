# What each Pelilauta page is for

This report reads every route under `apps/pelilauta/src/pages`, except the four that use
`layouts/EditorPage.astro` (out of scope by instruction: `create/thread`, `threads/[threadKey]/edit`,
`sites/[siteKey]/[pageKey]/edit`, `sites/[siteKey]/handouts/[id]/edit`). It also sets aside
routes that render no page for a reader — the `api/*` handlers, `sitemap.xml`, and
`rss/threads.xml`. That leaves **52 routes**, grouped below by what a reader does on them, not
by URL.

The question this report answers: which of these pages belong to the "pelilauta" group — the
base site, sharing one main navigation rail with the front page, the error pages, the forum
home, and a channel home. For each group, the layout is reported as evidence only. v18's
navigation model carries no authority here.

## All 52 routes

Every route in scope, with a best assumption of its group. Four values cover the set:

- **pelilauta** — belongs to the base site's shared rail.
- **own application** — has its own internal navigation; a reader enters and works inside it.
- **interruption** — a short detour a reader clears or completes, then returns from.
- **unsettled** — the evidence points more than one way; see Open questions.

Rows are grouped by assumed group, base "pelilauta" rows first, since that group is the
judgement being made. Use the Notes column to find the awkward cases; an empty cell means the
row is not in question.

| Page | Route | Assumed group | Notes |
| :--- | :--- | :--- | :--- |
| Front page | `/` | pelilauta | Known member. |
| Error: not found | `/404` | pelilauta | Known member. |
| Error: forbidden | `/403` | pelilauta | Known member. |
| Forum home | `/channels` | pelilauta | Known member. |
| Channel home | `/channels/[channel]` | pelilauta | Known member. |
| A discussion thread | `/threads/[threadKey]` | pelilauta | |
| A tag's contents | `/tags/[tag]` | pelilauta | |
| A member's profile | `/profiles/[uid]` | pelilauta | |
| Sites directory | `/sites` | pelilauta | |
| Search | `/search` | pelilauta | |
| A documentation article | `/docs/[id]` | unsettled | Has its own tray navigation like sites/library/admin, but nothing to do beyond reading. Open question 1. |
| Account settings | `/settings` | unsettled | Built as a modal, but a reader settles in rather than passing through. Open question 2. |
| Notification inbox | `/inbox` | unsettled | Built as a modal, but reads as a destination with no task to return to. Open question 2. |
| Offline fallback | `/offline.html` | unsettled | Shown automatically by the service worker when disconnected; not a page a reader chooses to visit. Open question 5. |
| Site home | `/sites/[siteKey]` | own application | |
| A site page | `/sites/[siteKey]/[pageKey]` | own application | |
| A site page's history | `/sites/[siteKey]/[pageKey]/history` | own application | |
| Site table of contents | `/sites/[siteKey]/toc` | own application | |
| Site assets list | `/sites/[siteKey]/assets` | own application | |
| A site asset | `/sites/[siteKey]/assets/[assetName]` | own application | Mounts a bare editor with no visible app; whether a reader views or edits here could not be confirmed. Open question 4. |
| Site clocks | `/sites/[siteKey]/clocks` | own application | |
| Site handouts list | `/sites/[siteKey]/handouts` | own application | |
| A site handout | `/sites/[siteKey]/handouts/[id]` | own application | |
| Site data view | `/sites/[siteKey]/data` | own application | |
| Site members | `/sites/[siteKey]/members` | own application | Built as a modal, unlike its sibling sub-pages. Open question 3. |
| Site options | `/sites/[siteKey]/options` | own application | Built as a modal, unlike its sibling sub-pages. Open question 3. |
| Site settings | `/sites/[siteKey]/settings` | own application | Built as a modal, unlike its sibling sub-pages. Open question 3. |
| Site content import | `/sites/[siteKey]/import` | own application | Built as a modal, unlike its sibling sub-pages. Open question 3. |
| Table of contents ordering | `/sites/[siteKey]/toc/settings` | own application | Built as a modal, unlike its sibling sub-pages. Open question 3. |
| Library (my sites) | `/library` | own application | |
| Admin home | `/admin` | own application | |
| Forum administration | `/admin/channels` | own application | |
| User management | `/admin/users` | own application | |
| Site activity | `/admin/sites` | own application | |
| Social media poster | `/admin/messaging` | own application | |
| Snackbar test utility | `/admin/snackbar-test` | own application | Internal test tool, not reader-facing. |
| Log in | `/login` | interruption | Gate before reaching an intended destination. |
| Create a profile | `/create-profile` | interruption | Onboarding gate before reaching an intended destination. |
| Accept terms | `/eula` | interruption | Gate before reaching an intended destination. |
| Onboarding | `/onboarding` | interruption | Gate before reaching an intended destination. |
| Sign out | `/logout` | interruption | Clears the session and redirects immediately; barely a page. |
| Create a site | `/create/site` | interruption | Leads into the new site once complete. |
| Confirm thread deletion | `/threads/[threadKey]/confirmDelete` | interruption | |
| Delete a reply | `/threads/[threadKey]/replies/[replyKey]/delete` | interruption | |
| Fork a reply into a new thread | `/threads/[threadKey]/replies/[replyKey]/fork` | interruption | |
| Create a site page | `/sites/[siteKey]/create/page` | interruption | |
| Create a handout | `/sites/[siteKey]/create/handout` | interruption | |
| Create a clock | `/sites/[siteKey]/create/clock` | interruption | |
| Delete a clock | `/sites/[siteKey]/delete/clock/[id]` | interruption | |
| Delete a site page | `/sites/[siteKey]/[pageKey]/delete` | interruption | |
| Add a channel | `/admin/channels/add` | interruption | Reached from Forum administration. |
| Clear local session (debug) | `/debug/purge` | interruption | Utility popup, not a reader destination. |

## The base site: places a reader browses

These pages share a trait: a reader arrives to read or browse something, and the page itself has
no internal section structure of its own. This is the four known members' company.

**Front page, forum home, channel home** (`/`, `/channels`, `/channels/[channel]`) — a reader
arrives to see what's active: recent threads, active sites, tags. They leave having picked
something to open, or having decided nothing here is worth their time. Layout: `Page.astro`.

**A single discussion thread** (`/threads/[threadKey]`) — a reader arrives to read one
conversation and, if they choose, add to it. They leave having read it, replied, or moved on.
Layout: `Page.astro`.

**A tag's contents** (`/tags/[tag]`) — a reader arrives to see what carries a given tag across
threads and site pages. They leave having found something tagged, or having found nothing.
Layout: `Page.astro`.

**A member's profile** (`/profiles/[uid]`) — a reader arrives to see who someone is on the site.
They leave informed, or having followed a link from there. Layout: `Page.astro`.

**The sites directory** (`/sites`) — a reader arrives to browse every public site, looking for
one to read. They leave having opened one, or not. Layout: `Page.astro`.

**Search** (`/search`) — a reader arrives with something specific in mind and types it in. They
leave having found it or not; the page holds a client-side search app but no browsing structure
of its own. Layout: `Page.astro`.

**A documentation article** (`/docs/[id]`) — a reader arrives to read one help or policy
document (EULA text, a how-to). Layout: `PageWithTray`, evidence only — see the docs question
below.

**The 404 and 403 pages** — a reader arrives here by accident, not by choice: a broken link or a
denied action. They leave by picking one of a few offered exits. Layout: `Page.astro`. Members
of the known group already.

All of these read as places: a reader goes to one, looks around, and either acts from there or
leaves. None interrupts a task the reader was already doing elsewhere — they are the task.

### The docs question

`/docs/[id]` uses `PageWithTray` with its own tray (`DocsTray`, listing every docs article). That
gives it internal navigation the four known members lack — closer to sites/library/admin's shape
than to the front page's. But a docs article's neighbors are other docs articles, not other
functions; there is no separate act to do inside it beyond reading. Whether that makes it part of
the base group or its own small library of articles is for the reader of this report to decide.

## Their own applications: sites, library, admin

The owner has already placed sites, library and admin outside the base group. The pages confirm
it: each mounts a tray component that is explicitly its own navigation, not the rail.

**Sites** (`/sites/[siteKey]/*` — home, a page and its history, table of contents, assets list
and single asset, clocks, handouts list and single handout, data view: 10 routes) share one
`SiteTray`, whose own comment calls it "the Tray used in the SiteApp -microfrontend." A reader
enters one site and works inside it — reading its pages, browsing its handouts, checking its
clock, reviewing a page's history — all without leaving the site's own frame. Layout:
`PageWithTray`, all of them.

**Library** (`/library`) mounts `LibraryTray`, a nav rail of its own (currently one entry plus a
link out to the public site list). A reader arrives to see the sites they hold membership in.
Layout: `PageWithTray`.

**Admin** (`/admin`, `/admin/channels`, `/admin/users`, `/admin/sites`, `/admin/messaging`,
`/admin/snackbar-test`: 6 routes) all mount `AdminTray`, a rail of admin tool links (forum
administration, social poster, user management, site activity, and a snackbar test utility). A
reader (a moderator or admin) arrives to run one specific administrative tool and leaves having
changed something on someone else's behalf. Layout: `PageWithTray`.

Nothing else in the route list mounts a tray of its own besides docs (discussed above), so no
further page reads as its own application by this test.

## Modal-layout routes: interruption, or a place that happens to be a popup

22 routes use `ModalPage`. The layout comment in `layouts/ModalPage.astro` states its intent
plainly: "popup-like interfaces for authenticated actions," never indexed, with a back action that
returns the reader to wherever they came from. That intent is the test applied below: does the
page genuinely interrupt a task the reader returns from, or is it a destination that happens to
have been built this way?

**Reads as genuinely modal — a short interruption, then back to what the reader was doing:**

- `login`, `create-profile`, `eula`, `onboarding` — gates a reader must clear before reaching
  where they were headed. They arrive blocked, complete one form, and continue.
- `create/site` — starts a new site from wherever the reader was (a plus button, a fab), and on
  completion sends them into the new site itself.
- `threads/[threadKey]/confirmDelete`, `replies/[replyKey]/delete`, `replies/[replyKey]/fork` —
  a single yes/no or one-shot action layered on top of the thread the reader was already reading.
- `sites/[siteKey]/create/page`, `create/handout`, `create/clock`, `sites/[siteKey]/delete/clock/[id]`,
  `sites/[siteKey]/[pageKey]/delete` — a one-shot create or delete action layered on the site the
  reader is already inside.
- `admin/channels/add` — a one-shot add-channel form reached from the admin channels page.
- `debug/purge` — a utility popup for clearing local state, not a destination in its own right.

**Reads as a place that happens to have been built as a modal — a reader settles in, rather
than passing through:**

- `settings` — a reader arrives to review and change several account preferences over more than
  a moment. It behaves like a small settings application, not an interruption; the modal chrome
  (full-screen bar, "back" instead of a URL to a fixed spot) is the only thing keeping it from
  reading as a place in its own right.
- `inbox` — a reader arrives to work through their notifications, an activity with its own
  content and no obvious "task interrupted elsewhere" to return to. It reads as a destination.
- `sites/[siteKey]/members`, `options`, `settings`, `import`, `toc/settings` — each is a
  sub-section of running a site: managing who belongs, site-wide options, table-of-contents
  ordering, importing content. A reader spends real time in each, and each sits alongside the
  site's other sub-sections (`toc`, `assets`, `clocks`) which are *not* modal. The split between
  which site sub-pages got `PageWithTray` and which got `ModalPage` does not track a difference
  in what the reader is doing — it reads as a v18-era implementation choice, not a functional
  one.

## Open questions

- **`/docs/[id]`** — reading material with its own tray-based navigation. Whether it belongs
  in the base group (a place a reader browses) or is its own small library of documents is not
  settled by function alone; both readings fit the evidence above.
- **`settings` and `inbox`** — flagged above as places, not interruptions, despite their modal
  layout. Whether that makes them base-group pages (each is a single destination with no
  internal section structure) or something closer to sites/library/admin (each holds enough
  going on to want its own internal navigation) could not be settled from the page code alone —
  `settings` mounts one Svelte app that manages its own internal sections client-side, so the
  page file does not show whether that app already behaves like sites' tray-based structure.
- **The five site sub-pages built as modals** (`members`, `options`, `settings`, `import`,
  `toc/settings`) sit logically beside `toc`, `assets`, and `clocks`, which are not modal. All
  eight are equally "inside the site," so the modal/non-modal split among them looks like
  leftover implementation history rather than a functional line. Placing them consistently with
  their non-modal siblings is a plausible read, but this report cannot confirm intent behind the
  original split.
- **`sites/[siteKey]/assets/[assetName]`** mounts a bare editor component (`AssetEditor`) with no
  Svelte app visible in the page file; what a reader actually does on the asset detail view (view
  metadata, edit an asset's markdown, or both) could not be confirmed without reading that
  component's internals, which sit outside this report's page-level scope.
- **`/offline.html`** renders automatically when the service worker detects no connection; a
  reader never chooses to open it. Whether a page nobody navigates to belongs in a classification
  of what a reader does is itself unsettled.
