# Fields

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

Pelilauta is a place people write to each other. Starting a thread, answering someone,
naming a site, writing a handout, searching the library — each is a reader typing. The
design system paints the cards, chips, buttons and rails around that act and has never
painted the surface the act happens on. This epic gives the reader's core act a surface
the design system owns, sampling `input[type="text"]` and `textarea`.

Nothing owns it today. `apps/design` loads `ds.css` alone and shows a browser default;
`apps/pelilauta` loads `@11thdeg/cyan-css` on every page and shows Cyan 4's. Fields are
also the largest element family Cyan still paints, so this is the surface v21's core
work reaches next.

## Success criteria

- A reader can tell a field is a field before touching it.
- A reader sees the same field in `apps/design` and in `apps/pelilauta`.
- A field shows a resting state, a hover state and an engaged state, each distinct in
  both colour schemes.
- The engaged state reaches a reader who taps, not only one who tabs.
- The hint a field carries is the design system's, and meets the contrast a non-text
  element must meet against its own resting fill.
- Removing `@11thdeg/cyan-css` from the sample's surfaces leaves their fields unchanged.
- `docs/chat-bar-field-study.md` and the shipped field agree, or the study records why
  they differ.

## Guardrails

- This epic runs as a spike, and a slice does not wait for a spec. Nobody knows yet what
  a field wants to be, so the sample is built to find out, and
  `specs/design-system/fields/spec.md` takes what holds once it is seen. Where the sample
  and the spec disagree, the sample is the evidence and the spec is amended.
- `docs/chat-bar-field-study.md` carries the settled intent. Where it and an inherited
  implementation disagree, the study holds; where the study and a live spec disagree,
  the contradiction is reported rather than resolved in code. One such contradiction is
  known: ruling 2 puts the chat bar at elevation 4, while
  `specs/design-system/components/cn-chat-bar/spec.md:55` says 3 and elevation 4's
  background is `primary-99` in Light — the colour the study gives a focused field.
- The Goal above carries the Context's why. It came from the product owner in this
  epic's planning and is not re-derived or re-interviewed.
- Colour roles take the `--cn-color-field*` names.
  `plans/debt/colour-token-naming.md` records why the majority shape in `semantic.css`
  is not the convention.
- v20 and Cyan 4 are read for what they do, never for what was meant. A value repeated
  across them is one value and several copies.
- The 34 `apps/pelilauta` surfaces that render a field today keep working while the
  sample is partial. A field the epic has not reached keeps Cyan's treatment rather than
  losing all treatment.
- Firestore schemas, write paths, authentication and public URLs do not change.
- The focus ring's geometry comes from the accessibility requirement. No repository here
  can settle it, and counting its occurrences is not evidence.

## Out of scope

- Forms: layout, grouping, submission, validation.
- Error and rejected-input treatment on a field.
- Select, checkbox, radio, range and file controls.
- The Markdown editor's own theme.
- Retiring `@11thdeg/cyan-css` from the application.
- `CnChatBar` itself, which resumes when this epic can be read.

## Possible work (non-binding)

- **Preflight boundary** — state where the reset stops and the field treatment begins,
  if `preflight/spec.md:115` proves ambiguous once the element style lands. Small, and
  possibly nothing.
- **Cyan overlap** — establish what Cyan's `input-text.css`, `textarea.css` and
  `select.css` still paint once the sample lands, and whether load order alone decides
  it. `plans/debt/form-control-register.md` records that the font rules already tie on
  specificity.

## Done

- **Field specification** — `specs/design-system/fields/spec.md` carries what the spike
  settled. The disabled state's value is still open.
- **The colour roles** — `semantic.css` and `tokens/semantic-color.json` carry the
  `--cn-color-field*` family, including the three label roles the spike added.
- **The element style** — `styles/fields.css` paints `input[type="text"]`, `textarea` and
  a `<label>` wrapping either.
- **The book** — `apps/design/src/content/base/fields.mdx` opens with every state of a
  text input and carries the states, the type, the spacing and the roles.
- **The spike closes here.** A field is done enough for the chat bar, which is the epic
  this one was cut from and resumes next. Fields the application has not reached keep
  Cyan's treatment.

## What the spike settled against the study

`docs/chat-bar-field-study.md` recorded the product owner's rulings before anything was
drawn. Seeing it drawn moved five of them, in the same voice, on 2026-08-20:

- **Hover paints no fill** (against rulings 4, 16 and 18). A fill that moves under the
  pointer washes a form in and out as a pointer crosses it. Hover recolours the indicator
  to a high-visibility primary step and doubles its width instead.
- **Dark focus takes a surface step**, not `primary-10` (against ruling 15). Light keeps
  the warm primary tint. In Dark the indicator and the label already carry the primary
  family, and a third primary left the state louder than the words in it.
- **A field draws no focus ring** (against ruling 10). A focused text control matches
  `:focus-visible` however it was reached, so a ring meant for the keyboard lands on every
  click. Material Design 3's filled field rules the same way, and the focus state carries
  WCAG 2.2 SC 2.4.7 on its own.
- **A label wrapping a field stands inside the fill**, and becomes the container. The
  study never ruled on a label, because the chat bar has none.
- **A field stands six units in a seven-unit row**, the pair a control takes.

The study is testimony of what was decided before the sample existed, and it is left as
written.

## Open questions

- The disabled state's value. The element style dims the resting treatment with the shared
  opacity, and `--cn-color-field-disabled` is still reserved rather than settled.
- The resting surface a field sits on. The book stands its specimens at elevation 1, and
  which elevation a form's fields sit at is unestablished.
- Assumption, not fact: that the 34 application surfaces want one field treatment. The
  epic samples two element types and does not survey the rest.
