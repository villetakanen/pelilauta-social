# Removing The Chroma Mistake Stripped 33 Colour Roles

Status: Recorded 2026-08-19, while settling the chat bar's field states

`--cn-color-*` is how a semantic colour role is named, and has been since v19. The
codebase does not keep it. `packages/design-system/styles/semantic.css` declares 33 colour
roles without the segment — `--cn-surface`, `--cn-border`, `--cn-focus-ring`,
`--cn-on-surface` — and two with it, `--cn-color-error` and `--cn-color-warning`.

The two are the survivors, not the exceptions. The chroma scales were at one point moved
into `--cn-color-{family}-{step}`, which repeats the palette inside the semantic
namespace; `docs/ARCHITECTURE.md:52-54` records the correction. Removing that mistake took
the legitimate prefix off the semantic roles with it.

Nothing collides today, because the system's non-colour tokens carry a category word
(`-size`, `-radius`, `-height`, `-width`, `-shadow-`, `-font-`, `-z-`, `-opacity`,
`-duration`). `--cn-border` and `--cn-border-radius` coexist on that accident. The
convention it stands in for is not the one the system means to keep.

The field family lands as `--cn-color-field` (`docs/chat-bar-field-study.md`), which is the
convention working. It also puts a new family out of step with 33 older roles, which is
this debt.

## What done looks like

Every semantic colour role in `semantic.css` carries `--cn-color-*`, and `ARCHITECTURE.md`
states the shape alongside the numbered-token prohibition it already carries, so the next
correction cannot strip it again.

The sweep reaches `semantic.css`, `tokens/semantic-color.json`, `styles/compat/cyan-4.css`,
every consuming stylesheet and component, and the tests that assert token names. It is one
changeset, not several.
