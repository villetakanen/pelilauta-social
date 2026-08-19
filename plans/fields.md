# Fields

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

The design system paints the surfaces a reader types into, and the design site shows
what they do. v21 owns no field: `apps/design` loads `ds.css` alone and renders a browser
default, while `apps/pelilauta` loads `@11thdeg/cyan-css` on every page and renders
Cyan 4's. A field reads one way in the book and another in the product, so no one can
say how a field behaves before building one — which is what stopped `plans/reply-authoring.md`.

## Success criteria

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

- `docs/chat-bar-field-study.md` carries the settled intent. Where it and an inherited
  implementation disagree, the study holds; where the study and a live spec disagree,
  the contradiction is reported rather than resolved in code.
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

- **Field specification** — a `specs/design-system/fields` spec carrying the states, the
  colour roles and the engaged-state selector, from the study's rulings. Every later
  slice waits on it being live.
- **The colour roles** — promote the study's values into `semantic.css` under the
  `--cn-color-field*` names, with the editor theme following the resting value it already
  reads. Waits on the spec.
- **The element style** — a `styles/fields.css` painting `input[type="text"]` and
  `textarea`, the partial sample this epic commits to. Waits on the roles.
- **The book** — a fields page in `apps/design` showing every state in both schemes, so
  the next reader can see a field rather than infer one. Waits on the element style.
- **Cyan overlap** — establish what Cyan's `input-text.css`, `textarea.css` and
  `select.css` still paint once the sample lands, and whether load order alone decides
  it. `plans/debt/form-control-register.md` records that the font rules already tie on
  specificity.

## Done

## Open questions

- The focus ring on a field. Cyan 4 suppressed it and signalled with fill and border;
  v20 only ever ringed actionable controls. The study keeps the ring on the
  accessibility requirement, and its width and offset are unsettled.
- Whether a field's engaged state is one state or two. The study rules `:focus-within`
  for the treatment a tap must reach; whether a keyboard reader additionally gets the
  ring, and whether `ARCHITECTURE.md` carries one row or two, is undecided.
- The resting surface a field sits on. The study anchors its steps to a raised surface
  rather than the page, and which elevation a form's fields sit at is unestablished.
- Assumption, not fact: that the 34 application surfaces want one field treatment. The
  epic samples two element types and does not survey the rest.
