# Secondary Surfaces

Every surface whose treatment came from Cyan's `.secondary` vocabulary, judged
against the post-v19 surface language, with a proposed remediation for each.
Report only; nothing here is applied. Sources: `specs/design-system/surface/spec.md`,
the Surface and Colour System books, `../pelilauta-20` read for what it does, and the
current tree, all read 2026-08-21.

## The language the surfaces answer to

`specs/design-system/surface/spec.md` publishes five levels and gives each one
meaning: 0 is the application, 1 is payload and the default, 2 is payload inside
payload — reached by nesting, never chosen — 3 floats over content, 4 is the
application interrupting the reader. A box takes a level because it occupies one of
those meanings; the vocabulary has no role for "different from the page" on its own.
The non-fill way to stay distinct is a `--cn-color-border` edge, the treatment CnCard
uses at elevation 0. De-emphasis is a text role, `--cn-on-surface-secondary`, not a
surface.

Cyan's `--color-secondary` aliases onto `--cn-surface-4` and `--color-on-secondary`
onto `--cn-text-high` (`packages/design-system/styles/compat/cyan-4.css:14-16`). The
alias is why a naive migration lands on level 4: it preserves the compat paint, and
the compat paint answered v18's question — "a box that should look different" — with
the one accent surface Cyan had. The design system's `.secondary` button and FAB
variants (`styles/buttons.css:167`, `styles/fab.css:85`) share the word and nothing
else; they are current vocabulary and stay.

## The inventory against `plans/debt/legacy-secondary-surfaces.md`

The record describes a tree that no longer exists.

| Recorded site | State on 2026-08-21 |
| :--- | :--- |
| `server/app/BetaHeader.astro:14` | File exists, nothing renders it. See below. |
| `svelte/characters/library/CharacterLibraryApp.svelte:26` | Gone with the characters sub-app (ADR 0003). |
| `svelte/keepers/CharacterKeeperApp.svelte:111,125,134` | Gone with the characters sub-app. |
| `server/app/EntryTagsWithLabelsSection.astro:24` | Migrated to `.chip.promoted` under the live chip spec. |
| `pages/sites/[siteKey]/characters.astro:93` | Gone with the characters sub-app. |
| `svelte/threads/ForumOnboardingArticle.svelte:6` | Marked retired; the component is orphaned. See below. |
| `svelte/thread-editor/ForkThreadApp.svelte:146` | Marked retired; the migration contradicts the surface spec. See below. |

One site the record misses:
`svelte/threads/ChannelSearchBox.svelte:76`, a Cyan `text-secondary` caption.

## Surface findings

### BetaHeader.astro — dead code, not a surface question

`apps/pelilauta/src/components/server/app/BetaHeader.astro:14-15` paints a beta
banner with `--color-secondary` and `--color-on-secondary`. No file in `apps/` or
`packages/` imports it; its git history is the initial bulk import (`14fe0614`) and
nothing since. The record's "on four pages" describes v18. v20 has no beta or
environment banner anywhere in `../pelilauta-20/app/pelilauta/src`.

**Proposed remediation:** delete the file. Whether v21 wants a beta banner is a
product question, and answering it yes means designing one in the current language
rather than wiring this one back. Deleting it retires two of the compat reads the
epic's `cyan-4.css` removal step lists.

### ForumOnboardingArticle.svelte — orphaned, and it never earned level 4

`apps/pelilauta/src/components/svelte/threads/ForumOnboardingArticle.svelte:6`
carries `surface elevation-4`, assigned 2026-08-12 (`639c49d7`) to preserve the level
the compat mapping already painted. No file imports the component; its
`threads:onboarding.*` strings appear nowhere else; the front page
(`apps/pelilauta/src/pages/index.astro`) composes streams, tags and FABs without it.

v20's front page has no onboarding card. Its only affordance for an anonymous reader
is the FAB: `../pelilauta-20/app/pelilauta/src/pages/index.astro:28-32` swaps the
create-thread FAB for a login link — a button-level treatment, not a surface.

An inline callout in page flow is not the application interrupting the reader, so the
level-4 assignment fails the spec's meaning even on the orphan's terms; a restored
callout reads as payload, level 1.

**Proposed remediation:** delete the component. Restoring an anonymous-reader
invitation is a product question, and v20's answer was the FAB, not a card.

### ForkThreadApp.svelte — a chosen level 2 the spec reserves for nesting

`apps/pelilauta/src/components/svelte/thread-editor/ForkThreadApp.svelte:146` gives
the quoted-reply preview `surface elevation-2`, assigned in the same compat-preserving
pass. The spec reaches level 2 by nesting alone
(`specs/design-system/surface/spec.md:43`), and this element has no elevated
ancestor: the frontmatter snippet renders inside `CnEditorShell`'s plain containers
(`packages/editor/CnEditorShell.svelte:208,222,239`), and `EditorPage.astro` puts no
surface class on its content wrapper. The preview paints a standalone level-2 rise it
did not earn.

The quote is what the writer reviews before forking — payload, level 1. What the
distinction is *for* is separating another author's content from the form around it,
and the language answers that with the `--cn-color-border` edge, not a fill.

**Proposed remediation:** `surface elevation-2` → `surface`, and a
`--cn-color-border` edge if the boundary reads too weak without one — an operator's
look at the rendered editor decides. `clip-after-3` on the same element stays open
under `plans/debt/clip-after-3-is-undeclared.md`.

v20 has no fork or quote feature, so no reference treatment exists.

### ChannelSearchBox.svelte — a text role without a public utility

`apps/pelilauta/src/components/svelte/threads/ChannelSearchBox.svelte:76` marks the
anonymous-reader caption `text-caption text-secondary mt-1 flex items-center gap-1`,
with `text-link` on the anchor at `:81`. This is text de-emphasis, not a surface;
the surface levels do not apply.

`text-secondary` is Cyan's class (`@11thdeg/cyan-css` `core/main.css:41`), resolved
through the compat aliases to `--cn-text-low` (`compat/cyan-4.css:21,140`). The
design system's role for de-emphasised text is `--cn-on-surface-secondary`
(`styles/semantic.css:27-30`), consumed today only inside `styles/toggle.css:70`. No
public utility exposes it, and v20's captions carry `text-caption` alone with no
colour modifier, so v20 does not answer the colour question.

**Proposed remediation:** the design decision is where the role becomes reachable —
a published text utility bound to `--cn-on-surface-secondary`, or a scoped
`color: var(--cn-on-surface-secondary)` in the component. One call site argues for
the scoped declaration; a second consumer is what earns a utility.

Of the neighbouring classes, `text-caption` is the design system's
(`styles/typography.css:134`) and survives. `mt-1`, `flex` and `items-center` are
Cyan atomics and die with the Cyan import. `gap-1` and `text-link` are declared
nowhere — they are no-ops today, so the layout and the link colour on these lines are
already not what the markup asks for.

## What follows

- The Cyan removal takes 13 `secondary` alias lines out of `cyan-4.css` with
  the file; after the four findings above, nothing reads them.
- `plans/debt/legacy-secondary-surfaces.md` records sites that are gone, migrated, or
  mis-migrated. Rewrite it to the two live findings — ForkThreadApp's chosen level
  and ChannelSearchBox's text role — or retire it in favour of this report once both
  land.
- The two orphan deletions and the ForkThreadApp class change fit this epic's triage
  slices; the text-role decision needs the operator before code.
