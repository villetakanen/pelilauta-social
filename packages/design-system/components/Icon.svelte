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

// Raw registry SVG for the noun, if any tier owns it. Community first, matching
// the resolution order below.
const rawSvg = $derived(getCommunityIcon(noun) || getManagedIcon(noun));

const content = $derived.by(() => {
  if (rawSvg) return rawSvg;

  // Bundled fallback tier (named essential symbols).
  const fallback = FallbackIcons[noun];
  if (fallback) {
    return fallback.paths
      .map((p) => {
        const fill = p.fill || "currentColor";
        const opacity = p.opacity !== undefined ? ` fill-opacity="${p.opacity}"` : "";
        return `<path d="${p.d}" fill="${fill}"${opacity} />`;
      })
      .join("");
  }

  // Missing glyph — unknown, empty, or absent noun.
  return FallbackIcons.missing.paths.map((p) => `<path d="${p.d}" fill="currentColor" />`).join("");
});

const viewBox = $derived.by(() => {
  if (rawSvg) {
    const match = rawSvg.match(/viewBox\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : "0 0 128 128";
  }
  return FallbackIcons[noun]?.viewBox || FallbackIcons.missing.viewBox || "0 0 24 24";
});

const innerHtml = $derived.by(() => {
  if (content.includes("<svg")) {
    return content
      .replace(/<\?xml[^>]*\?>/gi, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<svg[^>]*>/i, "")
      .replace(/<\/svg>/i, "");
  }
  return content;
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} role="img">
    <title>{noun}</title>
    {@html innerHtml}
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
