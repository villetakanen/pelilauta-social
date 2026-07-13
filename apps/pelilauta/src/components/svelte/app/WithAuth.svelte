<script lang="ts">
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
  <div class="content-columns">
    <article>
      <div class="flex justify-center p-2">
        <cn-icon noun="monsters" xlarge></cn-icon>
      </div>
      <div class="surface border-radius p-2 mt-2">
      <h1>{t('app:forbidden.title')}</h1>
      <p>{message || t('app:forbidden.message')}</p>
      {#if !$uid}
      <div class="toolbar justify-center">
        <a href="/login" class="button">
          {t('actions:login')}
        </a>
      </div>
      {/if}
      </div>
    </article>
  </div>
{/if}

