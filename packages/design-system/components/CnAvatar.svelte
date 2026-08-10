<script lang="ts">
/**
 * CnAvatar — the pictorial identity mark: a profile's image, its initials, or the
 * generic glyph when there is no profile.
 *
 * The backdrop percentage is derived from the nick only to tell co-present
 * profiles apart. It is not a stable identifier: the endpoints it mixes between
 * are token roles, so a palette change recolours every avatar, and that is
 * allowed.
 *
 * Spec: specs/design-system/identity-mark/spec.md
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
  size?: 'small' | 'medium';
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
 * Client-side enhancement only: hides the initials under an image with
 * transparent regions. The image may load before hydration, so the effect
 * re-checks the element instead of trusting the load event alone.
 */
let image: HTMLImageElement | undefined = $state();
let loaded = $state(false);
$effect(() => {
  src;
  loaded = Boolean(image?.complete && image.naturalWidth > 0);
});
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
    <span class="cn-avatar__initials" class:covered={loaded} aria-hidden="true">
      {initials}
    </span>
  {:else}
    <Icon noun="avatar" decorative size={size === 'small' ? 'small' : 'medium'} />
  {/if}
  {#if src}
    <!-- Painted over the always-rendered fallback: a failed load with an empty
         alt paints nothing, so recovery needs no script. -->
    <img
      {src}
      alt=""
      loading="lazy"
      decoding="async"
      bind:this={image}
      onload={() => {
        loaded = true;
      }}
    />
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
    color: var(--cn-on-avatar);
    background: color-mix(
      in oklch,
      var(--cn-avatar-backdrop-from),
      var(--cn-avatar-backdrop-to) var(--cn-avatar-mix, 50%)
    );
  }

  .cn-avatar--small {
    --cn-avatar-size: calc(var(--cn-line) * 1.5);
  }

  .cn-avatar--medium {
    --cn-avatar-size: calc(var(--cn-line) * 2);
  }

  .cn-avatar--anonymous {
    background: var(--cn-surface-2);
    color: var(--cn-on-surface);
  }

  .cn-avatar img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .cn-avatar__initials.covered {
    visibility: hidden;
  }

  .cn-avatar__initials {
    font-family: var(--cn-font-family-ui);
    font-weight: var(--cn-font-weight-emphasis);
    font-size: calc(var(--cn-avatar-size) * 0.4);
    line-height: 1;
    text-transform: uppercase;
  }
</style>
