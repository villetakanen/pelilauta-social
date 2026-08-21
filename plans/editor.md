# Editor

## Goal

`apps/pelilauta` authors markdown through a wrapper inherited from v18
(`src/components/svelte/CodeMirrorEditor/`), themed to Cyan, gridded by Cyan's
`.content-editor`, on routes whose shell keeps Cyan's bar. This epic replaces
it: a new `packages/editor` built fresh on current CodeMirror 6 — markdown-only,
rendered as a field under the fields and typography contracts, with v20's
`cyan-editor` as the design source — and editor views rebuilt as full-screen
surfaces in the local chrome. The editor is a canvas that takes the screen, not
flowing content in a layout container; the views load it lazily, as one shared,
browser-cached chunk. The v18 wrapper is deleted, not moved.

## Success criteria

- The editor lives in `packages/editor`; `apps/pelilauta` carries no editor
  wrapper, config or CodeMirror dependency — `packages/editor` declares them.
- The editor renders as a field: the mono face at the field size, the
  `--cn-color-field-*` roles, the block-end indicator; markdown highlighting
  takes its sizes from the typography tokens.
- A page without an editor ships no CodeMirror; the editor views share one
  content-hashed chunk the browser caches across them.
- Every view with an editor — thread create, thread edit, fork, page edit,
  handout edit — runs full-screen in `CnAppChrome` with the local bar;
  `EditorPage.astro` renders neither Cyan's bar nor `.content-editor`, and
  `plans/debt/editor-page-keeps-the-cyan-bar.md` is retired.
- A component spec governs the editor, filed under the extensions category on
  the component template, and the design site carries its book.
- The editor view is designed, not inherited: the canvas stands at the
  rendered page's measure with the gutter beside it, the frontmatter region
  beside the canvas past the small band and stacked within it, and a
  design-system shell spec governs that grammar.
- The shell warns on leaving a dirty document and lets the consumer mark it
  clean after a save.

## Guardrails

- Each authoring flow saves what it saves today: same fields, same markdown,
  same write path. No Firestore schema or security-rule change.
- `PageEditorForm`'s legacy-content migration (`htmlContent` → markdown on
  mount) survives the replacement.
- `packages/design-system` stays free of CodeMirror; the editor is a separate
  package, linked by Vite alias and tsconfig paths like `@design-system`.
- Pasted HTML still lands as sanitised markdown, as both v18's wrapper and
  v20's `cyan-editor` do it.
- The editor's field treatment — mono face, fill, indicator — is not reopened
  in this epic; a look-and-feel change is a later decision.

## Out of scope

- Profile bio textareas (settings, onboarding)
- Reply authoring; `CnChatBar` and its bar
- Rich composer: toolbar, write/preview tabs, WYSIWYG
- Attachment and image-upload behaviour changes

## Possible work (non-binding)

- Spec the editor: a component under the extensions category, on the component
  template — markdown-only scope, field conformance, lazy loading, the
  external-write contract (prefill and reset, not mid-edit sync). v20's
  `cyan-editor` spec is the design source.
- Settle the integration surface: a thin Svelte wrapper holds; CM6's
  transaction model keeps the glue small. Semantic props over Compartments; no
  raw extensions prop — it hands the config back to the views.
- Decide the internal split: v20's framework-agnostic factory under a thin
  Svelte host, or a single Svelte component. The factory's one gain is config
  and theme testable without a Svelte runtime.
- Build the package: markdown-only config on current CodeMirror 6, SSR-safe
  module load; alias `@editor` mirrored in tsconfig paths.
- Theme to the contracts: the field roles and typography tokens, not v20's
  `--cn-input` set; `fields.css` already names the markdown editor as the
  field that decided the mono face.
- The full-screen shell: `CnAppChrome` and the local bar on the editor routes,
  fixed-bar clearance settled by the editor layout —
  `content-container-layouts` excludes standalone canvas editors on purpose.
- Move the five views onto the package and shell, delete
  `src/components/svelte/CodeMirrorEditor/`, and give each route a bar label
  and heading, as the modal routes have.
- Prove the split: the non-editor bundle greps clean of `@codemirror`; the
  five views resolve the same editor chunk.
- A design-site book for the editor, under the extensions category, as v20's
  book page demos it.

- Spec and build the editor shell in `packages/editor`: bar, frontmatter
  region (consumer-slotted, shallow), body canvas at the page's measure —
  `content-golden`'s geometry — dirty tracking with an exit warning and a
  consumer `markClean`. `EditorPage.astro` shrinks to a consumer.
- Find and fix the rendered defects at and below 800px: bar clearance, field
  rendering. Review with screenshots at small, 800px and wide before done.

## Done

- packages/editor built: factory, Svelte host, field theme, paste, tests
- Five editor views full-screen in the local chrome; Cyan bar retired
- --cn-color-selection minted; the editor paints selection with it
- Editor book on the design site under extensions

## Open questions

- Known risk, accepted: v19's WYSIWYG intent may move every input to the prose
  font and discard the mono face. When that lands, the fields spec updates and
  this editor's type follows it.
