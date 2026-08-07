# Architecture

## Naming

### Components

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design system | `Cn{Name}` | `CnCard.svelte` |
| Reusable design-system tooling | `Ds{Name}` | `DsComposition.astro` |
| One-book private component | `{Name}` | `ContrastMatrix.astro` |
| Application component | `{Name}` | `ThreadCard.astro` |
| Astro route | Astro route grammar | `[threadKey]/index.astro` |

Reusable files use PascalCase; default import identifiers match filenames. Ported
components keep conforming v20 names. Unprefixed public v20 names gain `Cn` when
ported. `App*` is reserved pending a separate ownership decision.

### Tokens

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design-system token | `--cn-*` | `--cn-grid` |
| Theme palette | `--chroma-*` | `--chroma-primary-50` |
| Private to a scope | `--_*` | `--_elevation-duration` |
| Component private | local | `--icon-dim` |

A token private to a scope carries `_` where a public one carries `cn-`, and is
declared on the scope that owns it rather than on `:root`. Another capability may read
a `--cn-*` token; a `--_*` token may change or disappear with its scope. A value with
one consumer is private. Renaming it to `--cn-*` requires a second capability that
needs it.

Do not introduce `--cyan-*` or undocumented `--color-*` tokens.

### CSS Classes

| Scope | Pattern | Example |
| :--- | :--- | :--- |
| Public design-system class | purpose name | `.surface` |
| Component hook | `.cn-{name}` | `.cn-card`, for CnCard.svelte or CnCard.astro |
| Scoped component class | purpose name | `.cover` |
| Application-private class | purpose name | `.thread-card` |

Consumers apply public classes, never component hooks. Remove `.cn-` from a public
class when its capability migrates; retain it on component hooks.

## v18 compatibility

And known deviations.

### Character sub-app deprecation

v21 removes the character library, the character view, editor and deletion flow, the
creation wizard, the per-site listing, the GM keeper and the character-sheet admin
tooling, with the API routes, stores, schemas, Firestore access, locale strings and
`SiteSchema` fields behind them. No successor is planned.

See [ADR 0003](adrs/0003-discontinue-characters.md).
