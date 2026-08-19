<script lang="ts">
/**
 * CnLoader — canonical progress indicator combining a spinning dual ring over a static noun icon.
 */
import Icon from './Icon.svelte';

let {
  noun = 'fox',
  inline = false,
  label = 'Loading',
}: {
  noun?: string;
  inline?: boolean;
  label?: string;
} = $props();
</script>

<span
  class="cn-loader"
  class:cn-loader-inline={inline}
  role="status"
  aria-label={label}
>
  <span class="lds-dual-ring" aria-hidden="true"></span>
  <Icon {noun} size={inline ? 'small' : 'large'} />
</span>

<style>
  .cn-loader {
    --_loader-color: light-dark(var(--chroma-primary-60), var(--chroma-surface-60));
    display: block;
    position: relative;
    width: var(--cn-loader-size);
    height: var(--cn-loader-size);
    box-sizing: border-box;
    vertical-align: middle;
    color: var(--_loader-color);
  }

  .cn-loader-inline {
    width: var(--cn-line);
    height: var(--cn-line);
    display: inline-block;
  }

  .cn-loader :global(.cn-icon) {
    position: absolute;
    inset: 0;
    opacity: 0.44;
    margin: 0;
    pointer-events: none;
    color: currentColor;
  }

  .lds-dual-ring {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: absolute;
    inset: 0;
  }

  .lds-dual-ring::after {
    content: " ";
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: var(--cn-loader-line-width) solid var(--_loader-color);
    border-color: var(--_loader-color) transparent var(--_loader-color) transparent;
    animation: lds-dual-ring 1.2s linear infinite;
    opacity: 0.72;
    box-sizing: border-box;
  }

  @keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lds-dual-ring::after {
      animation: none;
    }
  }
</style>
