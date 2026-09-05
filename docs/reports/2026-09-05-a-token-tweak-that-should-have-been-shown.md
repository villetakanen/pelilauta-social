# What in the repo turned a colour experiment into a governed change

**Date:** 2026-09-05
**Branch:** feat/rc1-readiness
**Task as set:** test some colour fixes on isolated design-system components — change
the variable that chrome text and chrome icons read in `color: var(…)`, in dark mode,
and look at the result.

## Summary

The task was exploratory and isolated: try a colour on a component, see it in the book.
The repository offers no lane for that. Every path from "try a colour on this component"
runs through one of three things — the shared token layer, a spec gate that forbids
touching design-system code without ceremony, or an analytical colour toolset that
invites deriving values instead of showing them. The operator had to override the gate
by hand and correct the value twice before the change landed as what it always was: two
foreground steps.

This report inventories the repository artifacts that produced that outcome. Each is
cited; each entry names what the artifact led the agent to believe and what it cost. The
agent's missteps — a redundant token, a relative reading of an absolute request —
are treated here as evidence of where the repo steers, not as the subject.

## The isolated change was not isolable

The operator's mental model is that the chrome has a text colour and an icon colour. The
repository has no such things. What renders as "the chrome foreground" is emergent from
three unrelated inheritance paths:

- The bar sets its own: `CnAppBar.astro:89`, `color: var(--cn-color-on-surface)`.
- The rail sets nothing and inherits the document body's running-text colour,
  `--cn-color-text`, via `preflight.css`.
- Icons set nothing and paint `currentColor`: `CnIcon.svelte:51`.

So there is no single referent for "the chrome colour." To describe the *current* state
you trace three mechanisms; to change it you must first decide how to reconcile them —
unify the bar and rail or keep them apart, and whether the icon leaves `currentColor` at
all. That reconciliation is a scope decision the request never contained, and it is the
source of the value ping-pong (unify at 80/70 → per-surface 90/80 → uniform 90/80). The
operator was stating one absolute pair — text 90, icons 80, everywhere — against a code
structure that had no place to hold a single pair, so the request had to be restated
until it matched the structure rather than the model.

**Repo cause:** chrome foreground is not named anywhere. Three components each decide it
independently, so a request phrased against the operator's model cannot map to one edit.

## The governance gate has no exception for an experiment

`.claude/skills/design-system-developer/SKILL.md:9` opens: "A design-system change
requires a live governing spec before creating code, tests, or books. Do not begin
implementation without a live spec." `CLAUDE.md` restates it harder: "Every
design-system change requires a named open epic and a governing live spec. Do not alter
design-system code, tests, or specimen books until establishing both."

There is no carve-out for trying a value on an isolated component. Read literally — which
is how a harness instruction must be read — testing a colour is a design-system change,
so it is forbidden until an epic and a live spec exist. The agent therefore surfaced the
gate as a question, and the operator had to dispense with it by hand ("part of rc1
readiness, in current epic … amending specs _is always_ in scope"). That exchange was
not the agent being cautious; it was the agent following the only instruction the repo
gives, and the operator overriding an instruction that admits no exploration.

**Repo cause:** the skill and `CLAUDE.md` model exactly one kind of design-system work —
a governed migration or new component — and route everything through its gate. An
experiment on an existing component has no lane, so it inherits the ceremony of a
release-bound change.

## The cheapest experiment has no sanctioned form

The color system forbids a component from naming a chroma step directly
(`color-system/spec.md:61-62`), and the token layer it must go through instead is
generated with a do-not-edit banner (`semantic.css:2-3`). The rule is legitimate — it is
the color system stating its own layering contract, not a census of any component — but
its effect on an experiment is that the obvious move, "change this component's value and
look," has no approved shape. The approved shape is: add a semantic role to the JSON
source, regenerate the whole token layer, then point the component at the role.

The evidence that this is where the repo steers is that the agent minted a role it did
not need: `--cn-color-chrome` resolves to `light-dark(surface-10, surface-90)`
(`semantic.css:36-39`), byte-identical to `--cn-color-on-surface` (`semantic.css:27-30`),
which the bar already read. A redundant token was the path of least resistance because
the pipeline makes minting a role feel like the way to change a colour, even when an
existing role, or a one-line change of which variable a component reads, would do.

**Repo cause:** there is no local, throwaway way to try a colour on a component. The only
sanctioned path is a permanent addition to the shared token layer, so experiments arrive
as token-layer commits.

## A spec pinned an incidental detail as a contract

`chrome-actions/spec.md` held that "a chrome action takes its foreground from the
container that places it" — one foreground for label and glyph together. The operator's
final target has the glyph one step below the label, which is a trivial visual variant,
but against that sentence it reads as a contract breach, so it required a spec amendment
before the two-value result was legal.

**Repo cause:** the spec fixed "a single foreground" as behaviour when it was only the
state of the code at writing time. `docs/lessons/a-constraint-described-its-consumers.md`
names this pattern; the chrome-actions spec is another instance of it.

## The surfaced colour tooling is analytical, not visual

What the repo foregrounds for colour work is arithmetic: `color-contrast.test.ts` with
its step-gap floors, and the contrast narrative in `principles/color-system.mdx`. There
is no equally prominent affordance that says "render the candidate in the book and look."
So the agent reached for contrast tables and sub-AA warnings on a decision the operator
had already put outside contrast ("i dont care if the contrast goes to 0"). The design
site renders every candidate in Light and Dark on save; that loop existed and was not the
one the repo pointed at.

**Repo cause:** the colour toolset that surfaces first computes numbers; the one that
shows pixels is not surfaced, so derivation wins over demonstration by default.

## The correction was already written and never installed

`docs/lessons/an-appearance-change-was-argued-rather-than-shown.md` (2026-08-14) records
this exact sequence — a one-line appearance change reached through contrast tables and
reverted unrequested edits — and states the fix: "where the change is to appearance,
render the candidates on the design site and ask, rather than deriving the value from
contrast arithmetic." That line is absent from the skill. Verified: a grep for `render
the candidate | appearance | contrast` over
`.claude/skills/design-system-developer/SKILL.md` and its `.agents/skills/` duplicate
returns only an unrelated v20 sentence. The knowledge exists in the repo as an inert
note; nothing carries it into the path the agent runs.

**Repo cause:** lessons are written to `docs/lessons/` but there is no step that promotes
an accepted lesson into the skill or spec it corrects, so a recorded fix does not change
behaviour.

## What would have made it cheap

- **Name the chrome foreground once.** A single token pair the bar, rail and icons all
  read gives "change the chrome colour" a referent, so the request maps to one edit and
  the reconciliation that caused the ping-pong disappears.
- **Give exploration a lane.** A stated affordance to try a colour on an isolated
  component and view it in the book, without an epic, a spec or a permanent token, would
  match the ceremony to the stakes.
- **Point colour work at the book first.** Promote the 2026-08-14 lesson into the skill:
  for an appearance change, render candidates and ask for the absolute target, do not
  derive it.
- **Add a promotion step for lessons.** An accepted lesson should have a path into the
  skill or spec it corrects, or it will be rediscovered as a bug.

## Verified, and inferred

Verified from source: the three inheritance origins of the chrome foreground; the
identity of `--cn-color-chrome` and `--cn-color-on-surface`; the gate text in the skill
and `CLAUDE.md`; the absence of the 2026-08-14 fix from the skill.

Inferred: that a book-first loop would have converged faster is a judgement, not a
measurement — no such loop was run. That the operator held one absolute target from the
first message is read backward from three corrections that each restated an absolute
pair; it was not stated outright until the third.
