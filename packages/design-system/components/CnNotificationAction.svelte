<script lang="ts">
/**
 * CnNotificationAction — a chrome action that is a destination, carrying a
 * count.
 */
import CnIcon from './CnIcon.svelte';

let {
  href,
  noun,
  label,
  count,
  'aria-current': ariaCurrent,
}: {
  href: string;
  noun: string;
  label: string;
  count?: number | string;
  'aria-current'?: string;
} = $props();

const badge = $derived.by(() => {
  if (count === undefined || count === null || count === '') return undefined;
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1) return undefined;
  return n > 9 ? '9+' : String(n);
});

const name = $derived(badge ? `${label} ${badge}` : label);
</script>

<a
  class="chrome-action cn-notification-action"
  {href}
  aria-current={ariaCurrent}
  aria-label={name}
>
  <CnIcon {noun} decorative />
  <span>{label}</span>
  {#if badge}
    <span class="cn-notification-badge" aria-hidden="true">{badge}</span>
  {/if}
</a>
