---
name: a-book-specimen-can-build-clean-and-render-wrong
branch: feat/chrome
date: 2026-08-15
---

**Context:** The Rail book renders its component inside bounded frames, because a rail
positions itself against the chrome layer and would otherwise span the book page
(`packages/design-system/books/specimens/RailSpecimens.astro`).

**What happened:** The book was reported finished three times, each time with
`pnpm --filter design build` passing, and was wrong twice. The frames were first
`20rem` — 320px holding a 336px rail, so every pane overflowed by 17px and the two
colour schemes overlapped — and then `16rem` tall against 377px of content, so the
drawer's `overflow-y: auto` scrolled the footer, its line and the space above it off
the bottom of every frame. The second fault hid the one thing the specimen existed to
show. Both were found by measuring bounding boxes in a browser, and neither was
visible to the build, to `astro check`, or to a screenshot read at page scale.

**Suspected why:** The book skill's only stated evidence is the `docs/WRITING.md`
checks, so a specimen's geometry has no gate and a passing build reads as done.

**Fix:** Add a step to `.claude/skills/design-system-book/SKILL.md` under "Before the
pull request": where a specimen bounds a component, measure the component's bounding
box against the frame's on both axes in a browser and report the four numbers; state
there that a passing build is not evidence for a specimen's geometry.
