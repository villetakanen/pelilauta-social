# The editor shell keeps Cyan's bar

`apps/pelilauta/src/layouts/EditorPage.astro` still renders `AppBar.astro`, and through it
Cyan's `cn-app-bar`, on the four editor routes: a site page, a handout, a thread, and a new
thread. `ModalPage.astro` mounts the local bar in the same modal shape, so the swap itself
is mechanical.

Two things stop it.

`EditorPage` renders a bare `<main>` that expects a form carrying `.content-editor`, not
the `.app-main` host. The clearance for a fixed bar lives on that host
(`packages/design-system/styles/content-containers.css`), so an editor would put its first
row under the bar. Where the inset belongs instead is a question about the editor's
content layout, which is not settled, and answering it here would settle it by accident.

Leaving an editor is also the one modal departure that costs the reader something. The
back action reports `cn-back` and navigates nothing, and `ModalPage`'s handler leaves
immediately — correct for a delete confirmation, wrong for a half-written thread. Nothing
in the editors currently guards a departure either, so the behaviour to preserve is not
obvious.

## Remaining change

Mount `CnAppChrome` and `CnAppBar modal` as `ModalPage` does, once the editor's content
layout states where a fixed bar's clearance sits. Decide what a departure with unsaved work
does before wiring the layout's `cn-back` handler, and give each editor route a bar label
and a heading, as the modal routes have.
