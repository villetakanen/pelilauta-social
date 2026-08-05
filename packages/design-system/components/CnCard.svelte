<script lang="ts">
/**
 * CnCard - a server-rendered preview of one independently meaningful subject.
 *
 * The article remains passive when `href` is present: only the title and the
 * decorative cover link to the destination, leaving supplied controls independent.
 * CnCard composes the shared elevation utilities and owns no background or shadow.
 *
 * Spec: specs/design-system/components/cn-card/spec.md
 */
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';

let {
  title,
  description,
  elevation = 1,
  href,
  cover,
  srcset,
  sizes,
  noun,
  notify = false,
  alert = false,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  description?: string;
  elevation?: 0 | 1 | 2 | 3 | 4;
  href?: string;
  cover?: string;
  srcset?: string;
  sizes?: string;
  noun?: string;
  notify?: boolean;
  alert?: boolean;
  eyebrow?: Snippet;
  actions?: Snippet;
  children?: Snippet;
} = $props();
</script>

<article
  class="cn-card elevation-{elevation}"
  class:has-notify={notify}
  class:has-alert={alert}
>
  {#if cover}
    <div class="cover" aria-hidden="true">
      {#if href}
        <a href={href} tabindex="-1">
          <img src={cover} {srcset} {sizes} alt="" loading="lazy" />
          <span class="tint"></span>
        </a>
      {:else}
        <img src={cover} {srcset} {sizes} alt="" loading="lazy" />
        <span class="tint"></span>
      {/if}
    </div>
    {#if noun}
      <span class="cover-noun" aria-hidden="true">
        <Icon {noun} size="large" />
      </span>
    {/if}
  {/if}

  {#if eyebrow}
    <div class="eyebrow text-caption">
      {@render eyebrow()}
    </div>
  {/if}

  <h4 class="title">
    {#if href}
      <a href={href}>
        {#if !cover && noun}
          <span aria-hidden="true"><Icon {noun} size="small" /></span>
        {/if}
        {title}
      </a>
    {:else}
      {#if !cover && noun}
        <span aria-hidden="true"><Icon {noun} size="small" /></span>
      {/if}
      {title}
    {/if}
  </h4>

  {#if description || children}
    <div class="card-info">
      {#if description}
        <p class="description text-small">{description}</p>
      {/if}
      {#if children}
        {@render children()}
      {/if}
    </div>
  {/if}

  {#if actions}
    <div class="actions">
      {@render actions()}
    </div>
  {/if}
</article>

<style>
  .cn-card {
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-block-size: calc(7 * var(--cn-line));
    padding: var(--cn-grid) var(--cn-gap);
    overflow: hidden;
    container-type: inline-size;
    color: var(--cn-text-low);
    font-family: var(--cn-font-family);
    font-size: var(--cn-font-size-text);
    font-weight: var(--cn-font-weight-text);
    line-height: var(--cn-line-height-text);
    letter-spacing: var(--cn-letter-spacing-text);
    transition: background 0.27s ease-in-out;
    border-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
  }

  .cn-card::after {
    position: absolute;
    z-index: 0;
    inset-block-start: -1px;
    inset-inline-end: -1px;
    inline-size: calc(7 * var(--cn-grid));
    block-size: calc(7 * var(--cn-grid));
    clip-path: polygon(100% 0, 0 0, 100% 100%);
    border-start-end-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
    pointer-events: none;
    content: '';
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .cn-card.has-notify::after {
    background-color: var(--cn-color-info);
    opacity: 1;
  }

  .cn-card.has-alert::after {
    background-color: var(--cn-color-warning);
    opacity: 1;
  }

  .cover {
    position: relative;
    max-block-size: 100cqw;
    margin: calc(-1 * var(--cn-grid)) calc(-1 * var(--cn-gap)) 0;
    overflow: hidden;
    border-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
  }

  .cover a {
    display: contents;
  }

  .cover img {
    position: relative;
    display: block;
    inline-size: calc(100cqw + var(--cn-gap) * 2);
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
  }

  .tint {
    position: absolute;
    z-index: 1;
    inset-block-end: 0;
    inset-inline-start: 0;
    inline-size: calc(100cqw + var(--cn-gap) * 2);
    block-size: min(95cqw, 44%);
    background: linear-gradient(
      0deg,
      color-mix(
        in oklch,
        light-dark(
            var(--cn-color-primary-95),
            var(--cn-color-primary-30)
          )
          70%,
        transparent
      ),
      transparent
    );
    background-blend-mode: hard-light;
    border-end-start-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
    border-end-end-radius: var(
      --cn-border-radius-card,
      var(--cn-border-radius-large)
    );
    pointer-events: none;
  }

  .cover-noun {
    position: absolute;
    z-index: 2;
    inset-block-start: var(--cn-grid);
    inset-inline-end: var(--cn-grid);
    color: var(--cn-text-heading);
    filter: drop-shadow(0 0 4px var(--cn-shadow-color));
  }

  .eyebrow {
    margin: 0;
    color: var(--cn-text-low);
  }

  .cover ~ .eyebrow {
    margin-block-start: var(--cn-grid);
  }

  .eyebrow :global(a) {
    color: inherit;
    text-decoration: none;
  }

  .eyebrow :global(a:hover) {
    color: var(--cn-link-hover);
    text-decoration: underline;
  }

  .eyebrow :global(a:focus-visible),
  .title a:focus-visible {
    border-radius: 2px;
    outline: 2px solid var(--cn-focus-ring);
    outline-offset: 2px;
  }

  .title {
    display: -webkit-box;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: var(--cn-text-heading);
    font-size: var(--cn-font-size-h4);
    font-weight: var(--cn-font-weight-h4);
    line-height: var(--cn-line-height-h4);
    letter-spacing: var(--cn-letter-spacing-h4);
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .title a {
    color: inherit;
    text-decoration: none;
  }

  .title a:hover {
    text-decoration: underline;
  }

  .title :global(.cn-icon) {
    margin-inline-end: var(--cn-grid);
    vertical-align: middle;
  }

  .card-info {
    padding-block: var(--cn-grid);
    color: inherit;
  }

  .description {
    margin: 0;
    color: var(--cn-text-low);
  }

  .cn-card:is(.elevation-1, .elevation-2, .elevation-3, .elevation-4),
  .cn-card:is(.elevation-1, .elevation-2, .elevation-3, .elevation-4) .eyebrow,
  .cn-card:is(.elevation-1, .elevation-2, .elevation-3, .elevation-4) .description {
    color: light-dark(var(--cn-text-low), var(--cn-text));
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    block-size: calc(7 * var(--cn-grid));
    margin-block-start: auto;
    margin-inline: calc(-1 * var(--cn-gap));
    padding-inline: var(--cn-gap);
    gap: var(--cn-gap);
  }

  .actions :global(p),
  .actions :global(a) {
    margin: 0;
  }
</style>
