# `.text-h5` Is Applied And Never Declared

Status: Recorded 2026-08-22, found by removing Cyan's CSS in the deprecate-cyan epic

## What is wrong

Nine surfaces apply `text-h5` to a heading — `FeaturedTags.astro:30`,
`SyndicatePost.astro:30`, `SyndicateStream.astro:64`, `ThreadCard.astro:44`,
`BlueskyPostCard.astro:16`, `ChannelInfoRow.astro:17`, `SearchResult.svelte:21` and
`ProfileTool.svelte:111,116` — and `snippetHelpers.ts:65` adds it to every heading in
rendered Markdown, which is most of the library's prose.

Cyan's `typography/headings.css:49` was the only declaration, so the class now names
nothing. Each of those headings renders at whatever step its element carries: an `h2`
inside a card falls to `--cn-font-size-h2` at 48px where the class asked for a compact
label, and every Markdown heading in `snippetHelpers` was meant to flatten to one step.

## Why it stays open

The design system has no h5. `styles/typography.css` runs title, h1 to h4, text, small
and caption, and stops. Adding a step is a typography decision — where it sits in the
scale, and whether the need is a step at all rather than a label role the app bar and
the stat block already need — so it needs the typography spec, not a call site's guess.

The v20 scale is where the answer starts.

## What done looks like

A compact heading step, or the role that replaces it, is specified and declared, and
every surface above asks for it by that name.
