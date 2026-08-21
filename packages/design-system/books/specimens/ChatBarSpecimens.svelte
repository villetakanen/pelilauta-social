<script lang="ts">
/**
 * ChatBarSpecimens — the Definition of Done's four compositions, each inside
 * its own bounded `app-chrome` container, for one responsive band.
 *
 * CnChatBar positions itself against the nearest ancestor that establishes an
 * `app-chrome` container and answers `@container app-chrome (min-width:
 * 38.7501rem)` for its wider presentation — a fact this file exists to give
 * it, the same way `RailSpecimens.astro` gives `CnRail` a frame for `CnRail`'s
 * own container. Each `.frame` below declares `container: app-chrome /
 * inline-size` and a real block size, sized narrower or wider than that
 * threshold depending on `group`, and stands as CnChatBar's containing block
 * (`position: relative`) for its absolutely positioned placement root.
 *
 * The filler paragraphs stand for scrolled document content, and the strip at
 * each frame's block start stands for the application bar, whose depth is the
 * ceiling the chat bar grows to. Both are rigs rather than the components they
 * stand for: `CnAppBar` is an Astro component, and Astro cannot hand a Svelte
 * component the snippets this one takes for its regions. What the ceiling is
 * measured against is `--cn-app-bar-height`, which the rig declares and
 * apps/design/e2e/cn-chat-bar.spec.ts reads.
 *
 * Static: every composition renders server-side and holds what it was given,
 * with no client-side behaviour to demonstrate.
 *
 * Book: apps/design/src/content/components/cn-chat-bar.mdx
 */
import CnChatBar from '../../components/CnChatBar.svelte';
import CnIcon from '../../components/CnIcon.svelte';

let {
  group,
}: {
  /** Which responsive band's frame to render. */
  group: 'narrow' | 'wide';
} = $props();

/** Longer than any frame here can show, so the bar renders at its ceiling. */
const LONG_DRAFT = Array.from(
  { length: 12 },
  (_, index) =>
    `Rivi ${index + 1}: pitkä luonnos, joka ei mahdu kehykseen kokonaan.`,
).join('\n');

const MULTILINE_DRAFT = `Ajattelin, että voisimme siirtää seuraavan istunnon torstaille.
Samalla kannattaisi päättää, kuka tuo nopat.
Minulla on vielä se vanha D20-setti kaapissa.
Ja muistakaa tuoda hahmolomakkeet mukana.
Viimeksi unohdimme ne kotiin.`;
</script>

{#snippet frameContent()}
  <div class="app-bar-rig" aria-hidden="true"></div>
  <p class="filler" style="--rig-width: 88%"></p>
  <p class="filler" style="--rig-width: 62%"></p>
  <p class="filler" style="--rig-width: 74%"></p>
{/snippet}

{#snippet addMenu()}
  <button type="button">
    <CnIcon noun="assets" decorative />
    <span>Lisää kuva</span>
  </button>
  <button type="button">
    <CnIcon noun="label-tag" decorative />
    <span>Lisää linkki</span>
  </button>
{/snippet}

{#snippet sendAction()}
  <button type="button" class="chrome-action" aria-label="Lähetä">
    <CnIcon noun="send" decorative />
  </button>
{/snippet}

<div class="chat-bar-specimens" data-group={group}>
  <div class="cell" data-composition="empty">
    <p class="text-label">Empty</p>
    <div class="frame" data-band={group}>
      {@render frameContent()}
      <CnChatBar label="Vastaa keskusteluun" placeholder="Kirjoita viesti..." menuLabel="Lisää">
        {#snippet menu()}{@render addMenu()}{/snippet}
        {#snippet trailing()}{@render sendAction()}{/snippet}
      </CnChatBar>
    </div>
  </div>

  <div class="cell" data-composition="multiline">
    <p class="text-label">Multiline</p>
    <div class="frame" data-band={group}>
      {@render frameContent()}
      <CnChatBar
        label="Vastaa keskusteluun"
        placeholder="Kirjoita viesti..."
        value={MULTILINE_DRAFT}
        menuLabel="Lisää"
      >
        {#snippet menu()}{@render addMenu()}{/snippet}
        {#snippet trailing()}{@render sendAction()}{/snippet}
      </CnChatBar>
    </div>
  </div>

  <div class="cell" data-composition="supporting-content">
    <p class="text-label">Supporting content</p>
    <div class="frame" data-band={group}>
      {@render frameContent()}
      <CnChatBar label="Vastaa keskusteluun" placeholder="Kirjoita viesti..." menuLabel="Lisää">
        {#snippet supporting()}
          <span class="attachment-chip">
            <CnIcon noun="assets" decorative />
            <span>kartta.png</span>
            <button type="button" aria-label="Poista liite">
              <CnIcon noun="delete" decorative />
            </button>
          </span>
        {/snippet}
        {#snippet menu()}{@render addMenu()}{/snippet}
        {#snippet trailing()}{@render sendAction()}{/snippet}
      </CnChatBar>
    </div>
  </div>

  <div class="cell" data-composition="at-the-ceiling">
    <p class="text-label">A draft past the frame</p>
    <div class="frame" data-band={group}>
      {@render frameContent()}
      <CnChatBar
        label="Vastaa keskusteluun"
        placeholder="Kirjoita viesti..."
        value={LONG_DRAFT}
        menuLabel="Lisää"
      >
        {#snippet menu()}{@render addMenu()}{/snippet}
        {#snippet trailing()}{@render sendAction()}{/snippet}
      </CnChatBar>
    </div>
  </div>

  <div class="cell" data-composition="disabled">
    <p class="text-label">Disabled</p>
    <div class="frame" data-band={group}>
      {@render frameContent()}
      <CnChatBar
        label="Vastaa keskusteluun"
        placeholder="Kirjoita viesti..."
        value="Lähetetään..."
        disabled
        menuLabel="Lisää"
      >
        {#snippet menu()}{@render addMenu()}{/snippet}
        {#snippet trailing()}
          <button type="button" class="chrome-action" aria-label="Lähetä" disabled>
            <CnIcon noun="send" decorative />
          </button>
        {/snippet}
      </CnChatBar>
    </div>
  </div>
</div>

<style>
  .chat-bar-specimens {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: var(--cn-gap);
  }

  .cell {
    display: grid;
    row-gap: var(--cn-grid);
  }

  .text-label {
    margin: 0;
  }

  /*
   * Test rig, not design-system values: narrow sits well inside the small
   * band, wide sits well past --cn-breakpoint-small (38.75rem) and past
   * --cn-measure, so the surface's readable-width cap is visible against the
   * frame it is centred in.
   */
  .frame {
    position: relative;
    container: app-chrome / inline-size;
    overflow: hidden;
    max-inline-size: 100%;
    padding-block-start: var(--cn-gap);
    color: var(--cn-color-text);
    background: var(--cn-color-background);
    border: 1px solid var(--cn-color-border);
  }

  .frame[data-band='narrow'] {
    inline-size: 22rem;
    block-size: 18rem;
  }

  .frame[data-band='wide'] {
    inline-size: 46rem;
    block-size: 16rem;
  }

  /*
   * The application bar's depth, which is what the chat bar stops at. It paints
   * a band rather than a bar: nothing here depends on what an application bar
   * looks like, only on how deep it is.
   */
  .app-bar-rig {
    block-size: var(--cn-app-bar-height);
    background: var(--cn-color-surface-2);
  }

  .filler {
    inline-size: var(--rig-width, 100%);
    block-size: var(--cn-grid);
    margin-inline: var(--cn-gap);
    margin-block-end: var(--cn-line);
    border-radius: var(--cn-border-radius-small);
    background: var(--cn-color-surface-2);
  }

  .chrome-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--cn-grid);
    color: inherit;
    background: none;
    border: none;
  }

  .attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--cn-grid);
    padding: var(--cn-grid) var(--cn-gap);
    color: var(--cn-color-text);
    background: var(--cn-color-surface-1);
    border-radius: var(--cn-border-radius-medium);
  }

  .attachment-chip button {
    display: inline-flex;
    padding: 0;
    color: inherit;
    background: none;
    border: none;
  }
</style>
