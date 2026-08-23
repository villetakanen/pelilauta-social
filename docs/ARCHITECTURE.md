# Architecture

## Naming

### Components

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design system | `Cn{Name}` | `CnCard.svelte` |
| Reusable design-system tooling | `Ds{Name}` | `DsComposition.astro` |
| One-book private component | `{Name}` | `StepTable.astro` |
| Application component | `{Name}` | `ThreadCard.astro` |
| Astro route | Astro route grammar | `[threadKey]/index.astro` |

Reusable files use PascalCase; default import identifiers match filenames. Ported
components keep conforming v20 names. Unprefixed public v20 names gain `Cn` when
ported. `App*` is reserved pending a separate ownership decision.

A `Cn{Name}` or `Ds{Name}` component ships a component book. Its spec lists any
base or principles book that also carries it.

### Marks

Three marks, and each names one thing. The **logomark** is the product's graphic —
the fox. The **wordmark** is the product's name set in type. The **identity mark**
is a person's, and `specs/design-system/identity-mark/spec.md` governs it: a reader's
avatar and their nick, never the product's.

Prose says which. "The mark", unqualified, tells a reader nothing, and the product
and the person are the two things chrome most often shows side by side.

### Tokens

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design-system token | `--cn-*` | `--cn-grid` |
| Palette | `--chroma-{family}-{step}` | `--chroma-primary-50` |
| Private to a scope | `--_*` | `--_elevation-duration` |
| Component private | local | `--icon-dim` |

A token private to a scope carries `_` where a public one carries `cn-`, and is
declared on the scope that carries it rather than on `:root`. Another capability may read
a `--cn-*` token; a `--_*` token may change or disappear with its scope. A value with
one consumer is private. Renaming it to `--cn-*` requires a second capability that
needs it.

`--chroma-{family}-{step}` predates Cyan and is the one deliberate exception to the
`--cn-*` namespace: [ADR 0002](adrs/0002-preserve-v20-design-system-names.md)
preserves it because a theme replaces a whole chroma family while keeping its
lightness steps, so the contrast a semantic role depends on survives the swap.
`--cn-*` names a semantic role that depends on chroma; every colour role carries
`--cn-color-{role}`, and no role carries a numbered step. Do not introduce
`--cyan-*`, undocumented `--color-*`, or a numbered `--cn-color-{family}-{step}`
token — the accidental vocabulary that repeats `--chroma-*` inside the `--cn-*`
namespace.

### CSS Classes

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design-system class | purpose name | `.surface` |
| Component hook | `.cn-{name}` | `.cn-card`, for CnCard.svelte or CnCard.astro |
| Scoped component class | purpose name | `.cover` |
| Application-private class | purpose name | `.thread-card` |

Consumers apply public classes, never component hooks. Remove `.cn-` from a public
class when its capability migrates; retain it on component hooks.

### Interaction states

A state's name comes from the platform selector that switches it on. The design
system changes how a state looks; it does not rename, merge or invent states.

| Selector | Meaning | Token |
| :--- | :--- | :--- |
| `::selection` | Text the reader has selected. | `--cn-selection`, `--cn-on-selection` |
| `:hover` | A pointer rests on the control. | `--cn-color-hover` |
| `:active` | The control is being activated. | `--cn-color-active` |
| `:focus-visible` | Keyboard focus rests on the control. | `--cn-color-focus-ring` |
| `[aria-current]` | This is the current destination. | `--cn-color-indicator`, `--cn-color-on-indicator` |
| `[aria-pressed]` | This toggle is on. | `--cn-color-indicator`, `--cn-color-on-indicator` |
| `[aria-expanded]` | This disclosure is open. | Indicator glyph; no surface. |

A row reserves a name; its token is declared when a consumer first needs it.

`--cn-selection` belongs to text selection alone. A control the reader cannot
select carries no selection token, class or state name; interactive chrome is
non-selectable, so `selected` never names one of its states.

A persistent container surface and a transient state layer compose: the overlay
sits above the container and both remain visible. v20 is a visual reference, not
a source of truth for state naming.

## v18 compatibility

And known deviations.

### Thread images

v1 through v18 wrote thread pictures several ways and never migrated them. v21 sets the
canon: `thread.poster` is the primary image, `thread.images` the gallery, reconciled on
read in `parseThread`.

### Site owner tools

v18 serves the pages behind a site's members, tools, settings, content transfer and
table-of-contents ordering to anybody holding the address, and lets the client app decide
what to render. v21 verifies the session on the server and answers a reader outside the
site's `owners` with 403, through `requireSiteOwner`.

The deviation is deliberate. v21 states this policy in its own pages rather than leaving it
to what the shared backend permits, and it does not widen a page to match a permission it
finds there.

### One session guard

v18 hand-rolls the same session check on every page that needs one, and skips it where the
client app refuses instead — the notification inbox served a reader's chrome to
anybody holding the address. v21 states the check once, in
`@pelilauta/base/utils/requireSession`, and every page that needs a reader takes it.

The base application holds the guard because every application needs it. A page states it
and returns what it answers with, so the check cannot be half-applied.

### Administrative tools

v18 guards the forum's channels alone and leaves the rest of administration to the client,
so the user management, the social media poster, the sites' activity and the snackbar
utility rendered for anybody holding the address. v21 guards every one of them, through
`requireAdmin`.

A developer tool takes more: `requireDeveloperTools` also asks whether this environment
shows the tools at all, and no deployed environment does. Where it does not, the tool
answers as a page that does not exist, and its entry is absent from the rail.

### Character sub-app deprecation

v21 removes the character library, the character view, editor and deletion flow, the
creation wizard, the per-site listing, the GM keeper and the character-sheet admin
tooling, with the API routes, stores, schemas, Firestore access, locale strings and
`SiteSchema` fields behind them. No successor is planned.

See [ADR 0003](adrs/0003-discontinue-characters.md).

### Syndicated feeds

v18 stacks one section per feed on the front page, each with its own heading, its own
"read more" link, and — for one of the two — a promotional image the other does not
get. A reader sees two lists, and how recent either one is against the other is
something they have to work out. v21 merges every feed into one stream ordered by
recency, and names its source on each post.

The deviation is deliberate. The stream is for the ecosystem's activity, not each
publisher's, and a section per publisher makes the page grow a section every time one
is added. One stream ranks the whole community by when it last posted, and takes a new
publisher as configuration.

v21 also holds a place in the stream for a publisher declared guaranteed. v18 needs no
such notion: a section per publisher cannot be excluded by another's activity.
