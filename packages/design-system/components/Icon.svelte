<script lang="ts">
/**
 * Icon — server-rendered icon with tiered source resolution.
 *
 * Resolution precedence (v20 target model): open-source → managed
 * (@myrrys/proprietary) → bundled fallback → missing glyph. Monochrome artwork
 * inherits the surrounding foreground via currentColor; branded artwork keeps
 * the colors encoded in its reviewed source. An empty or absent noun is treated
 * as unknown and renders the missing glyph (spec decision 2026-07-20).
 *
 * Accessibility: unlike the v20 source, the icon is NOT decorative by default.
 * It announces its noun to assistive technology as the icon's `aria-label`
 * (defaulting to the noun) and carries the noun as an SVG <title> tooltip,
 * preserving observed v18 behavior (spec decision 2026-07-20). A consumer may
 * pass an explicit `aria-label` that overrides the noun as the icon's aria-label
 * when the noun is not the meaning to convey — e.g. a brand mark. This affects
 * ARIA only: the <title> tooltip stays the noun. A `decorative` icon exposes
 * nothing: no role, no aria-label, and no <title>, so no tooltip either
 * (spec decision 2026-08-10).
 */
import { getIcon as getOpenSourceIcon } from '../icons/open-source';
import { FallbackIcons } from './icon-fallback';
import { getManagedIcon } from './managed-tier';

let {
  noun = '',
  size = 'medium',
  'aria-label': ariaLabel = '',
  decorative = false,
}: {
  noun?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
  'aria-label'?: string;
  decorative?: boolean;
} = $props();

// Resolved icon as pre-normalized inner markup plus a viewBox. The open-source
// and managed tiers store this shape directly (normalized at generation time,
// not here); the fallback and missing tiers assemble it from structured paths.
const resolved = $derived.by(() => {
  const registered = getOpenSourceIcon(noun) || getManagedIcon(noun);
  if (registered) return registered;

  // Bundled fallback tier (named essential symbols).
  const fallback = FallbackIcons[noun];
  if (fallback) {
    return {
      viewBox: fallback.viewBox || '0 0 24 24',
      inner: fallback.paths
        .map((p) => {
          const fill = p.fill || 'currentColor';
          const opacity =
            p.opacity !== undefined ? ` fill-opacity="${p.opacity}"` : '';
          return `<path d="${p.d}" fill="${fill}"${opacity} />`;
        })
        .join(''),
    };
  }

  // Missing glyph — unknown, empty, or absent noun.
  return {
    viewBox: FallbackIcons.missing.viewBox || '0 0 24 24',
    inner: FallbackIcons.missing.paths
      .map((p) => `<path d="${p.d}" fill="currentColor" />`)
      .join(''),
  };
});

const sizes: Record<string, string> = {
  xsmall: 'var(--cn-icon-size-xsmall)',
  small: 'var(--cn-icon-size-small)',
  medium: 'var(--cn-icon-size)',
  large: 'var(--cn-icon-size-large)',
  xlarge: 'var(--cn-icon-size-xlarge)',
};
const dimension = $derived(sizes[size] || sizes.medium);
</script>

<span class="cn-icon" data-noun={noun} style="--icon-dim: {dimension};">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={resolved.viewBox}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : ariaLabel || noun}
    aria-hidden={decorative ? 'true' : undefined}
  >
    {#if !decorative}<title>{noun}</title>{/if}
    {@html resolved.inner}
  </svg>
</span>

<style>
  .cn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-dim);
    height: var(--icon-dim);
    aspect-ratio: 1 / 1;
    overflow: hidden;
  }
  .cn-icon svg {
    width: 100%;
    height: 100%;
  }
</style>
