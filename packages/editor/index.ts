/**
 * The editor's public surface. A consumer takes the Svelte host from
 * `@editor/CnEditor.svelte`, or the factory from here to host it itself.
 *
 * The state assembly is not exported. `createEditorState` and its arguments are
 * how the factory is built, not what it offers — publishing them would hand the
 * extension set back to the views, which is the arrangement this package
 * replaced.
 */

export type { EditorHandle, EditorOptions } from './createEditor';
export { createEditor } from './createEditor';
