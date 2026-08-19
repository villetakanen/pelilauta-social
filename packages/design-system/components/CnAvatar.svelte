<script lang="ts">
/**
 * CnAvatar — the pictorial identity mark: a profile's image, its initials, or the
 * generic glyph when there is no profile.
 *
 * The backdrop percentage is derived from the nick only to tell co-present
 * profiles apart. It is not a stable identifier: the endpoints it mixes between
 * are token roles, so a palette change recolours every avatar, and that is
 * allowed.
 */
import Icon from './Icon.svelte';

let {
  src = '',
  nick = '',
  size = 'medium',
  'aria-hidden': ariaHidden = false,
}: {
  src?: string;
  nick?: string;
  size?: 'small' | 'medium' | 'large';
  'aria-hidden'?: boolean;
} = $props();

/** A nick spreads across the mix range; neighbouring nicks land far apart. */
function spread(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 101;
}

const initials = $derived([...nick].slice(0, 2).join('').toUpperCase());
const decorative = $derived(ariaHidden || !nick);

/**
 * Only the quote and the backslash need escaping inside `url("…")`; everything
 * else a Storage URL or a data URI carries is already legal there. Percent-
 * encoding the whole string would re-encode the escapes a data URI is made of.
 */
const imageLayer = $derived(
  src
    ? `background-image: url("${src.replaceAll('\\', '%5C').replaceAll('"', '%22')}")`
    : '',
);
</script>

<div
  class="cn-avatar cn-avatar--{size}"
  class:cn-avatar--anonymous={!nick}
  style={nick ? `--cn-avatar-mix: ${spread(nick)}%` : undefined}
  role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : nick}
  aria-hidden={decorative ? 'true' : undefined}
>
  {#if nick}
    <span class="cn-avatar__initials" aria-hidden="true">
      {initials}
    </span>
  {:else}
    <Icon noun="avatar" decorative />
  {/if}
  {#if src}
    <!-- The image is a background rather than an <img> so that recovery needs no
         script: a background that fails to load paints nothing at all, while a
         broken <img> paints the browser's own glyph over the fallback — a torn
         page in Chrome, a question mark in Safari, neither of them removable. -->
    <span class="cn-avatar__image" style={imageLayer}></span>
  {/if}
</div>

<style>
  .cn-avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    inline-size: var(--cn-avatar-size);
    block-size: var(--cn-avatar-size);
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    overflow: hidden;
    user-select: none;
    box-shadow: var(--cn-shadow-elevation-1);

    /*
     * Private to CnAvatar: only this component paints a derived backdrop, so
     * these carry no `--cn-*` name (docs/ARCHITECTURE.md). An identity
     * backdrop is any mix of the two ends, so both and everything between
     * answer to --_on-avatar; the bands invert per mode.
     */
    --_avatar-backdrop-from: light-dark(
      var(--chroma-primary-30),
      var(--chroma-primary-60)
    );
    --_avatar-backdrop-to: light-dark(
      var(--chroma-surface-50),
      var(--chroma-surface-80)
    );
    --_on-avatar: light-dark(var(--chroma-surface-95), var(--chroma-surface-10));

    color: var(--_on-avatar);
    background: color-mix(
      in oklch,
      var(--_avatar-backdrop-from),
      var(--_avatar-backdrop-to) var(--cn-avatar-mix, 50%)
    );
  }

  /* All three diameters are named in styles/units.css, because a list's overflow
     count has to match them without restating the arithmetic. */
  .cn-avatar--small {
    --cn-avatar-size: var(--cn-avatar-size-small);
  }

  .cn-avatar--medium {
    --cn-avatar-size: var(--cn-avatar-size-medium);
  }

  .cn-avatar--large {
    --cn-avatar-size: var(--cn-avatar-size-large);
  }

  .cn-avatar--anonymous {
    background: var(--cn-surface-2);
    color: var(--cn-on-surface);
  }

  /* The glyph is a proportion of the mark rather than a step on the icon scale:
     the mark has three diameters and the scale has no step between 36px and 72px,
     so a large mark would take a glyph that runs to its rim. The proportion is the
     one the medium mark already had. */
  .cn-avatar :global(.cn-icon) {
    width: calc(var(--cn-avatar-size) * 0.75);
    height: calc(var(--cn-avatar-size) * 0.75);
  }

  /* Inside a list the ring insets the image, leaving a rim of the nick's own
     backdrop to separate the mark from the one it overlaps. Outside one the ring
     is zero and the image fills the circle. */
  .cn-avatar__image {
    position: absolute;
    inset: var(--cn-avatar-ring, 0px);
    border-radius: 50%;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .cn-avatar__initials {
    font-family: var(--cn-font-family-ui);
    font-weight: var(--cn-font-weight-emphasis);
    font-size: calc(var(--cn-avatar-size) * 0.4);
    line-height: 1;
    text-transform: uppercase;
    /* The initials answer to the backdrop the nick derived, not to the text
       treatment of the surface the mark was dropped onto. */
    text-shadow: none;
  }
</style>
