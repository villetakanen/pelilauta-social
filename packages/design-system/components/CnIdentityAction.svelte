<script lang="ts">
/**
 * CnIdentityAction — a chrome action that invites a signed-out reader to sign
 * in, and carries a signed-in reader to their own part of the application.
 *
 * The consumer states the mode: it is never derived from whether `nick` is
 * present.
 */
import CnAvatar from './CnAvatar.svelte';
import CnIcon from './CnIcon.svelte';

let {
  href,
  label,
  signedIn = false,
  nick = '',
  src = '',
  disabled = false,
  'aria-current': ariaCurrent,
}: {
  href: string;
  label: string;
  signedIn?: boolean;
  nick?: string;
  src?: string;
  disabled?: boolean;
  'aria-current'?: string;
} = $props();
</script>

<a
  class="chrome-action cn-identity-action"
  {href}
  aria-current={ariaCurrent}
  aria-disabled={disabled ? 'true' : undefined}
  tabindex={disabled ? -1 : undefined}
>
  {#if signedIn}
    <CnAvatar {nick} {src} size="small" aria-hidden />
  {:else}
    <CnIcon noun="login" decorative />
  {/if}
  <span>{label}</span>
</a>
