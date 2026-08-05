# Cyan's `.secondary` Is A Tint, Not An Elevation

Status: Recorded 2026-08-05 while reviewing the beta.19 elevation release

## What is wrong

`styles/compat/cyan-4.css` maps `--color-secondary` to `--cn-surface-4` and
`--color-on-secondary` to `--cn-text-high`, so Cyan's `.secondary` atomic paints the
elevation-4 background wherever v18 used it. The mapping is the only one available:
Cyan has one accent surface and v21 has five levels.

v18 did not use `.secondary` to mean the highest system layer. It used it to mean
"a box that should look different from the page", which is why the class now lands
on things that are not system-layer content:

- `server/app/BetaHeader.astro:14` — a page banner, on four pages
- `svelte/characters/library/CharacterLibraryApp.svelte:26` — a listing section
- `svelte/keepers/CharacterKeeperApp.svelte:111,125,134` — three panels
- `server/app/EntryTagsWithLabelsSection.astro:24` — `cn-chip.secondary`, a chip
- `svelte/threads/ForumOnboardingArticle.svelte:6` and
  `pages/sites/[siteKey]/characters.astro:93` — both combine `.surface .secondary`,
  where `surface.css` wins the background by load order and only the foreground
  changes

Nothing here is broken: the paired foreground keeps every one of them legible in
both themes. But each is a surface whose level was chosen by v18's vocabulary
rather than by v21's hierarchy, and the compat layer cannot tell them apart. Moving
elevation 4 to the primary family made that visible, because these screens changed
appearance without appearing in any plan's acceptance surface.

The mapping is also what keeps them coherent today. Removing it before the call
sites are migrated leaves them unstyled, so the compat entry stays until each
surface is assigned a real level.

## What done looks like

Each call site above is migrated to the elevation level its content actually
occupies, and to a Svelte component where the surrounding surface has one. A chip
is not a system layer; a page banner is not a dialog.

The `.secondary` compat mapping is removed once no call site depends on it, and
`docs/MIGRATION.md` records the class as retired rather than translated.
