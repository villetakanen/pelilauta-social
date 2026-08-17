# Hoisting the chrome to the front page, as-is

An analysis, not a plan. It answered one question for the Pelilauta UX spike, which closed
on 2026-08-17: if we put the new chrome on the front page and settle for nothing else, what
is the change, and what do we find out?

Other routes are allowed to break. `Page.astro` is shared, so they will.

## What is already in place

More than the plan implied. `apps/pelilauta/src/layouts/Page.astro` already renders
`CnAppChrome` and `CnAppBar`, with the search and share actions as chrome actions and
the FAB tray inside the chrome box. The front page already passes a poster and a FAB
tray through it. The remaining gap on the front page is the navigation itself:
`Page.astro` still renders the legacy `AppRail`, and no `CnTray` anywhere.

So this is not a chrome migration. It is a navigation swap inside chrome that landed
already.

## The change

Five edits, in `Page.astro` unless said otherwise.

**The scope attribute.** `styles/tray.css` makes the bar and the main region cede the
tray's inline size through `[data-cn-tray-scope] .app-main` and
`[data-cn-tray-scope] .cn-app-bar` — descendant selectors, so something has to
contain both. The design site wraps them in a `.shell` div. Pelilauta should put the
attribute on `<body>` instead, because `CnPoster` documents `<body>` as the only
placement it supports, and a wrapper div would either exclude the poster from the
scope or move it. The stylesheet's stated reason for not selecting `body` is that a
book renders a tray as a specimen inside its own content; Pelilauta renders no
specimens, so the reason does not reach it.

**The tray.** `CnTray` inside `CnAppChrome`, after `CnAppBar`, with a label from
`navigation:main`. It positions itself against the chrome box and needs nothing else
from the layout.

**The entries.** `AppRail`'s seven, restated as chrome actions rather than
`cn-navigation-icon`. Four are plain anchors and port directly: front page, channels,
library, docs. Three are Svelte islands reading session state — inbox, admin, and the
settings-or-login control — and they carry more than markup; see below.

**Removing the old.** Delete `<AppRail />` and the `--cn-block-end-chrome:
var(--cn-height-rail)` rule at the foot of the file, which exists only to clear
Cyan's block-end rail on handheld. The mobile bottom bar goes with it, which is the
model's intent. Cyan's rail stylesheet stays imported, because `EditorPage`,
`ModalPage` and `PageWithTray` still render `AppRail`.

**The identity placement.** This one is not a hoist. Today `CnAppBar` renders the
context glyph, or the fox, as its own leading region, and hides it below the small
breakpoint to reserve that slot for the tray trigger. What we want is the identity at
the tray's block start on tablet and desktop, with the trigger below it, and the
trigger alone in the bar on mobile. That is a change to `CnAppBar` and `CnTray`
together, and both specs are approved. Worth treating as its own step, after the
hoist stands, rather than smuggling it in.

## Design-system inventory

The containers are complete. What is thin is one presentation, and the script the
tray's spec asks for.

**Complete and in use.** `CnAppChrome` gives the fixed box. `CnAppBar` gives the bar,
its title pair, its leading region, its scroll veil and its modal mode. `CnTray` gives
the trigger, the drawer, the scrim, the rail and the reader slot, and opens and closes
without script. `styles/chrome-actions.css` is the substantial one: `.chrome-action`
carries the target, the state surface, hover, active, focus, disabled and reduced
motion, and switches between compact and labelled off `--cn-chrome-presentation`
through a container style query — which is what makes a rail's entries collapse to
their glyphs without the entry knowing what container it is in. `styles/tray.css`
gives the ceding mechanism. Every token either needs is published: the rail and tray
widths, the bar height, the three stacking values, `--cn-scrim`, `--cn-surface-4`,
`--cn-shadow-elevation-4`, `--cn-hover`, `--cn-active`, `--cn-focus-ring`. Every icon
noun `AppRail` uses resolves through the managed tier.

**There is no entry component, by design.** The tray spec makes entries the
consumer's. An entry is `a.chrome-action` holding an `Icon` and a label `span`, and
Pelilauta writes that markup itself — one small application component, not a
design-system gap.

### Missing controls

**A chrome action with a notification pill.** Nothing in the design system draws a
count on a chrome action. Cyan carried it as `cn-navigation-icon`'s `notification`
attribute; nothing replaced it. The inbox entry needs it. `chrome-actions.md` calls it
the status adjunct, and no approved spec mentions it at all.

**A login/profile control.** The design system ships `CnAvatar` — a picture of a
person, with no link and no state. It ships nothing that is a chrome action standing
for the reader. `chrome-actions.md` calls it the identity action, and it is open.

Cheaper than it looks, though. `CnAvatar` sizes itself, and `--cn-avatar-size-small`
is 36px — the same as `--cn-icon-size`, the step a chrome action resolves its
foreground to. An avatar drops into a chrome action at the right dimension already.
The only thing `chrome-actions.css` withholds is the `flex: none` it gives `.cn-icon`
and `.cn-loader`, and that matters only in the labelled presentation.

### Missing states and behaviour

**The current destination.** `--cn-indicator` and `--cn-on-indicator` as colour roles,
and the `[aria-current]` rule that paints them. Approved, unimplemented. This one
blocks: the front page cannot be judged by navigation that never shows where the
reader is.

**The tray's `Escape` and focus containment.** Its spec requires both and no source
provides either.

**Nested entries.** `CnTray` implements no nesting — nothing hides a nested entry on
the rail or takes it out of the tab order, though the spec states both. Seven flat
entries do not ask for it. The site and forum passes will.

## What we would be hoisting

The tray shipped as the design site's navigation, and that use is its only
verification. Three things its own specs require are not there.

**No current-destination indicator.** `navigation-destination/spec.md` is approved
and unimplemented: `--cn-indicator` and `--cn-on-indicator` appear nowhere in
`styles/color-theme.css`, no rule answers `[aria-current]`, and
`apps/design/e2e/navigation-destination.spec.ts` does not exist. A reader would get
navigation that never shows where they are. On the front page that is the most
visible defect of the lot, and it is the one thing I would fix before looking at the
result, because judging entries against navigation that cannot indicate the current
one teaches us the wrong thing.

**No Escape, no focus containment.** The tray spec requires both, and requires them
to act on whichever checkbox pair the window displays. Neither exists — `Escape`
appears in no design-system or design-site source. A reader who opens the drawer on a
phone leaves it by the scrim or by finding the trigger again.

**No book and no browser check.** There is no Tray book and no tray spec in
`apps/design/e2e`, so the tray's Definition of Done is open. The design site is the
regression test, by accident.

Against that, `plans/debt/the-design-site-index-is-not-tray-entries.md` records the
rail clipping book titles because the design site's entries have no icons. Pelilauta's
entries all have nouns, so Pelilauta would be the tray's first correct consumer, and
the rail band is the one thing here likely to look better than it does today.

## What the islands cost

The three session-reading entries need chrome-action items `chrome-actions.md` lists
as open, so hoisting them as-is loses behaviour rather than porting it.

`InboxNavigationButton` shows an unread count as `cn-navigation-icon`'s `notification`
attribute. A chrome action has no count presentation — that is the **status adjunct**
item, unshipped. `SettingNavigationButton` shows the profile's avatar and nick when
authenticated and a login glyph when not. That is the **identity action** item, also
unshipped, and it is the natural occupant of the tray's block-end reader slot rather
than another entry in the list. `AdminNavigationButton` is a plain conditional anchor
and ports as-is.

The cheapest honest first pass is: port the four anchors and admin as chrome actions,
leave inbox showing its glyph without its count, and put the settings-or-login control
in the reader slot with the avatar it already has. Then the count and the identity
action ship against their specs, from `chrome-actions.md`, once the front page has
shown us what they have to sit in.

## Order

1. Indicator roles and the `[aria-current]` rule, with the contrast assertion and the
   e2e spec its approved spec already names.
2. The hoist: scope on `body`, `CnTray` in the chrome, the five portable entries, the
   settings control in the reader slot, `AppRail` and the block-end rule deleted.
3. Look at it, at all three windows, in both themes. This is the point of the exercise.
4. Escape and focus containment.
5. Identity placement across `CnAppBar` and `CnTray`.

Steps 1 and 2 are the hoist. Everything after is what looking at it will have earned.

## What this answers, and what it does not

It answers geometry. Whether the tray's two sizes are right for Pelilauta's content,
whether the main region cedes the right amount at each window, whether the bar and the
tray read as one surface, where the identity belongs, and whether a poster survives a
tray painting over it.

It does not answer entries. The seven we would port are v18's global rail — the
structure the tray's model explicitly does not survive, since the tray is local
navigation and the front page's entries are only the front page's. Hoisting them tells
us the surface works. What belongs in it is the next question, and the front page is
where the spike asks it.
