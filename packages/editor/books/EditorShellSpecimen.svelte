<script lang="ts">
/**
 * EditorShellSpecimen — the editor shell as a route renders it: a document with
 * a body and frontmatter, under a modal bar, at every width.
 *
 * It plays the consumer's part, and only that part. It slots the frontmatter
 * fields, it reports what the shell says about dirtiness, and its save marks
 * the document clean. It computes no dirtiness of its own, which is the split
 * the shell exists to hold.
 *
 * Book: apps/design/src/content/extensions/editor.mdx
 * Route: apps/design/src/content/extensions/editor-shell.mdx
 */
import CnEditorShell from '../CnEditorShell.svelte';

/*
 * Two axes the specimen varies on, read from the query string rather than
 * passed in: the route that mounts this is prerendered, so a server that read
 * them would bake one pair into the page. The specimen is client-only, so the
 * location is always there to read.
 *
 * `?gutter=off` drops the line numbers; `?fields=off` slots no frontmatter, so
 * the canvas keeps the whole column.
 */
const params = new URLSearchParams(window.location.search);
const gutter = params.get('gutter') !== 'off';
const fields = params.get('fields') !== 'off';

let shell: CnEditorShell | undefined = $state();
let dirty = $state(false);
let saves = $state(0);

let value = $state(`# Kolmannen kerroksen kartta

Kirjoita **tähän** se, mitä pelaajat näkevät. Käytä \`inline-koodia\`
viittauksiin, tai lainaa lähdettä:

> Ovi on lukossa, ja avain on jo käytetty.

- Portaikko ylös
- Portaikko alas
- Ovi, jota ei ole kartassa
`);

let title = $state('Kolmannen kerroksen kartta');
let tags = $state('kartta, luolasto');
let isPublic = $state(true);

function save() {
  saves += 1;
  shell?.markClean();
}
</script>

<CnEditorShell
  bind:this={shell}
  bind:value
  {gutter}
  placeholder="Kirjoita tähän..."
  onDirtyChange={(next) => {
    dirty = next;
  }}
  frontmatter={fields ? frontmatterFields : undefined}
/>

{#snippet frontmatterFields()}
  <div class="specimen-fields">
    <label>
      Otsikko
      <input type="text" name="title" bind:value={title} />
    </label>
    <label>
      Avainsanat
      <input type="text" name="tags" bind:value={tags} />
    </label>
    <label class="specimen-fields__toggle text-label">
      <input type="checkbox" name="public" bind:checked={isPublic} />
      Julkinen
    </label>

    <p class="text-caption" data-testid="shell-dirty">
      {dirty ? 'Tallentamattomia muutoksia' : 'Tallennettu'}
    </p>
    <p class="text-caption" data-testid="shell-saves">Tallennuksia: {saves}</p>
    <button type="button" class="cta" disabled={!dirty} onclick={save}>
      Tallenna
    </button>
  </div>
{/snippet}

<style>
  .specimen-fields {
    display: flex;
    flex-direction: column;
  }

  .specimen-fields__toggle {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
    margin-block: var(--cn-grid);
  }
</style>
