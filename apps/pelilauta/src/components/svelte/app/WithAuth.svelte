<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';
import type { Snippet } from 'svelte';
import { uid } from '../../../stores/session';

interface Props {
  allow: boolean;
  message?: string;
  children?: Snippet;
}

const { allow, children, message }: Props = $props();
</script>

{#if allow}
  {@render children?.()}
{:else}
  <div class="content-prose">
    <article>
      <div class="text-center">
        <CnIcon noun="monsters" size="xlarge" />
      </div>
      <div class="surface">
        <h1>{t('app:forbidden.title')}</h1>
        <p>{message || t('app:forbidden.message')}</p>
        {#if !$uid}
        <div class="text-center">
          <a href="/login" class="button">
            {t('actions:login')}
          </a>
        </div>
        {/if}
      </div>
    </article>
  </div>
{/if}

<style>
  /*
   * No container reaches into this box, so it states the interval between
   * its own blocks: the title, the message and the login action.
   */
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>

