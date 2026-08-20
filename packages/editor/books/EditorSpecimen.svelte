<script lang="ts">
/**
 * EditorSpecimen — the editor at rest with markdown already in it, so the
 * highlighting is visible without a reader typing anything: a heading, strong
 * and emphasis, a link, inline code, a quote, a list. Two toggles drive
 * `disabled` and `gutter`, the two axes the book shows varying.
 *
 * Book: apps/design/src/content/extensions/editor.mdx
 */
import CnEditor from '../CnEditor.svelte';

let value = $state(`# Kenttä

Muistiinpano tukee **lihavointia**, *kursivointia* ja [linkkejä](https://pelilauta.social).

Käytä \`inline-koodia\` viittauksiin, tai lainaa:

> Peli alkaa siitä, missä sopimus loppuu.

- Ensimmäinen kohta
- Toinen kohta
- Kolmas kohta
`);

let disabled = $state(false);
let gutter = $state(false);
</script>

<div class="editor-specimen">
  <div class="editor-specimen__controls text-label">
    <label>
      <input type="checkbox" bind:checked={disabled} />
      disabled
    </label>
    <label>
      <input type="checkbox" bind:checked={gutter} />
      gutter
    </label>
  </div>
  <div class="editor-specimen__frame">
    <CnEditor bind:value {disabled} {gutter} />
  </div>
</div>

<style>
  .editor-specimen {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .editor-specimen__controls {
    display: flex;
    gap: var(--cn-gap);
  }

  .editor-specimen__frame {
    display: flex;
    block-size: 20rem;
  }
</style>
