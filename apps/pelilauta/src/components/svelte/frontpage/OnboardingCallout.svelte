<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>

{#if !$uid}
  <aside
    class="onboarding-callout surface elevation-4 border-radius"
    aria-labelledby="onboarding-title"
  >
    <div class="layout">
      <div class="artwork" aria-hidden="true">
        <img
          src="/myrrys-proprietary/public-domain/talk-to-me-by-wootha-620px.webp"
          alt=""
          class="border-radius"
        />
      </div>
      <div class="content">
        <h2 class="text-h4" id="onboarding-title">{t('app:onboarding.title')}</h2>
        <p>{t('app:onboarding.text')}</p>
        <div class="actions">
          <a href="/login" class="button">
            {t('actions:login')}
          </a>
        </div>
      </div>
    </div>
  </aside>
{/if}

<style>
  .onboarding-callout {
    padding: 0;
    overflow: hidden;
    color: var(--cn-text-high);
  }

  .artwork {
    min-block-size: calc(10 * var(--cn-grid));
    overflow: hidden;
  }

  .artwork img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    aspect-ratio: 16 / 7;
    object-fit: cover;
  }

  .content {
    display: grid;
    gap: var(--cn-grid);
    padding: var(--cn-gap);
  }

  .content h2,
  .content p {
    margin: 0;
  }

  .content h2 {
    color: var(--cn-text-high);
  }

  .actions {
    display: flex;
    align-items: center;
    min-block-size: calc(5 * var(--cn-grid));
    padding-block-start: var(--cn-grid);
  }

  @container surface-area (min-width: 28rem) {
    .layout {
      display: grid;
      grid-template-columns: minmax(10rem, 2fr) minmax(0, 3fr);
    }

    .artwork img {
      aspect-ratio: auto;
    }

    .content {
      align-content: center;
    }
  }
</style>
