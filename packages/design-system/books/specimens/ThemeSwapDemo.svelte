<script lang="ts">
/**
 * ThemeSwapDemo — the substitution contract in `specs/design-system/color-system/spec.md`,
 * performed rather than described: toggling redeclares a core family's 13
 * `--chroma-{family}-*` custom properties on this component's own root, to a
 * zero-chroma ramp that keeps each step's OKLCH lightness (`primary-10`'s
 * exception included). Primary and surface are the system's only two core
 * families, and each swaps independently — every semantic role inside keeps
 * resolving through the same `--cn-*` declarations; only the literal layer
 * they read changed, and only inside this container.
 *
 * v20's ColorScale.svelte faked the same idea with `filter: grayscale(1)`, a
 * post-process over the rendered pixels. This redeclares the tokens instead, so a
 * reader can inspect the mechanism a real theme swap uses: the tokens change, the
 * components do not.
 *
 * Book: apps/design/src/content/principles/color-system.mdx
 */

/** Family step → its OKLCH lightness. `primary-10` is the theme's declared exception. */
const STEPS: ReadonlyArray<[step: string, lightness: number]> = [
  ['0', 0],
  ['10', 0.12],
  ['20', 0.2],
  ['30', 0.3],
  ['40', 0.4],
  ['50', 0.5],
  ['60', 0.6],
  ['70', 0.7],
  ['80', 0.8],
  ['90', 0.9],
  ['95', 0.95],
  ['99', 0.99],
  ['100', 1],
];

/** Surface has no lightness exception: every step uses step/100 directly. */
const SURFACE_STEPS: ReadonlyArray<[step: string, lightness: number]> =
  STEPS.map(([step]) => [step, Number(step) / 100]);

type Family = 'primary' | 'surface';

const grayscale: Record<Family, boolean> = $state({
  primary: false,
  surface: false,
});

const toggle = (family: Family) => {
  grayscale[family] = !grayscale[family];
};

const declare = (family: Family, steps: ReadonlyArray<[string, number]>) =>
  steps
    .map(
      ([step, lightness]) =>
        `--chroma-${family}-${step}: oklch(${lightness} 0 0);`,
    )
    .join(' ');

const containerStyle = $derived(
  [
    grayscale.primary ? declare('primary', STEPS) : '',
    grayscale.surface ? declare('surface', SURFACE_STEPS) : '',
  ]
    .filter(Boolean)
    .join(' '),
);
</script>

<div class="theme-swap-demo" style={containerStyle}>
  <div class="toggles">
    <button
      type="button"
      class="toggle"
      aria-pressed={grayscale.primary}
      onclick={() => toggle('primary')}
    >
      Primary: {grayscale.primary ? 'Colour' : 'Grayscale'}
    </button>
    <button
      type="button"
      class="toggle"
      aria-pressed={grayscale.surface}
      onclick={() => toggle('surface')}
    >
      Surface: {grayscale.surface ? 'Colour' : 'Grayscale'}
    </button>
  </div>

  <div class="surface elevation-2 sample">
    <h3>Retkikunnan päiväkirja</h3>
    <p>
      Read the <a href="#theme-swap-demo">expedition log</a> before the next session.
    </p>
    <button type="button" class="cta">Liity retkikuntaan</button>
  </div>

  <div class="ramps">
    <div class="ramp-group">
      <span class="ramp-label">primary</span>
      <ol class="ramp">
        {#each STEPS as [step] (step)}
          <li>
            <span
              class="swatch"
              style={`background: var(--chroma-primary-${step});`}
              title={`--chroma-primary-${step}`}
            ></span>
            <span class="step">{step}</span>
          </li>
        {/each}
      </ol>
    </div>

    <div class="ramp-group">
      <span class="ramp-label">surface</span>
      <ol class="ramp">
        {#each SURFACE_STEPS as [step] (step)}
          <li>
            <span
              class="swatch"
              style={`background: var(--chroma-surface-${step});`}
              title={`--chroma-surface-${step}`}
            ></span>
            <span class="step">{step}</span>
          </li>
        {/each}
      </ol>
    </div>
  </div>
</div>

<style>
  .theme-swap-demo {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .toggles {
    display: flex;
    gap: var(--cn-gap);
  }

  .toggle {
    justify-self: start;
  }

  .sample h3 {
    margin-block-start: 0;
  }

  .sample .cta {
    margin-block-start: var(--cn-gap);
  }

  .ramps {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .ramp-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--cn-text-low);
  }

  .ramp {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ramp li {
    flex: 1 1 2.5rem;
    text-align: center;
  }

  .swatch {
    display: block;
    block-size: 2rem;
    border: 1px solid var(--cn-border);
  }

  .step {
    display: block;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }
</style>
