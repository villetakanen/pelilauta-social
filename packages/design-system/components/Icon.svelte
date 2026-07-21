<script lang="ts">
/**
 * Icon — server-rendered icon with tiered source resolution.
 *
 * Resolution precedence (v20 target model): community → managed
 * (@myrrys/proprietary) → bundled fallback → missing glyph. Monochrome artwork
 * inherits the surrounding foreground via currentColor; branded artwork keeps
 * the colors encoded in its reviewed source. An empty or absent noun is treated
 * as unknown and renders the missing glyph (spec decision 2026-07-20).
 *
 * Accessibility: unlike the v20 source, the icon is NOT decorative by default.
 * It announces its noun to assistive technology through an SVG <title>,
 * preserving observed v18 behavior (spec decision 2026-07-20).
 *
 * Spec: specs/design-system/components/cn-icon/spec.md
 */
import { getIcon as getManagedIcon } from "@myrrys/proprietary";
import { getIcon as getCommunityIcon } from "../icons/community";
import { FallbackIcons } from "./icon-fallback";

let { noun = "", size = "medium" }: {
  noun?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge";
} = $props();

// Resolved icon as pre-normalized inner markup plus a viewBox. The community
// and managed tiers store this shape directly (normalized at generation time,
// not here); the fallback and missing tiers assemble it from structured paths.
const resolved = $derived.by(() => {
  const registered = getCommunityIcon(noun) || getManagedIcon(noun);
  if (registered) return registered;

  // Bundled fallback tier (named essential symbols).
  const fallback = FallbackIcons[noun];
  if (fallback) {
    return {
      viewBox: fallback.viewBox || "0 0 24 24",
      inner: fallback.paths
        .map((p) => {
          const fill = p.fill || "currentColor";
          const opacity = p.opacity !== undefined ? ` fill-opacity="${p.opacity}"` : "";
          return `<path d="${p.d}" fill="${fill}"${opacity} />`;
        })
        .join(""),
    };
  }

  // Missing glyph — unknown, empty, or absent noun.
  return {
    viewBox: FallbackIcons.missing.viewBox || "0 0 24 24",
    inner: FallbackIcons.missing.paths.map((p) => `<path d="${p.d}" fill="currentColor" />`).join(""),
  };
});

const sizes: Record<string, string> = {
  xsmall: "var(--cn-icon-size-xsmall)",
  small: "var(--cn-icon-size-small)",
  medium: "var(--cn-icon-size)",
  large: "var(--cn-icon-size-large)",
  xlarge: "var(--cn-icon-size-xlarge)",
};
const dimension = $derived(sizes[size] || sizes.medium);
</script>

<span class="cn-icon" data-noun={noun} style="--icon-dim: {dimension};">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={resolved.viewBox} role="img">
    <title>{noun}</title>
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
    vertical-align: middle;
  }
  .cn-icon svg {
    width: 100%;
    height: 100%;
  }
</style>
