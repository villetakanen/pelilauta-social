<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>
{#if !$uid}
  <cn-card
    title={t('app:onboarding.title')}
    noun="fox"
    cover="/myrrys-proprietary/public-domain/talk-to-me-by-wootha-620px.webp"
    href="/login"
    class="secondary mb-2"
    >
    <p>{t('app:onboarding.text')}</p>
    <div slot="actions" class="toolbar items-center">
      <a href="/login" class="button">
        {t('actions:login')}
      </a>
    </div>
  </cn-card>
{/if}