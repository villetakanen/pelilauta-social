<script lang="ts">
import { t } from 'src/utils/i18n';
import { newCount } from '../../../stores/inbox';
import { isActive } from '../../../stores/session/computed';

const count = $derived.by(() => {
  if ($isActive) {
    if ($newCount > 9) {
      return '9+';
    }
    // The notification prop shows a string, even if it's 0 - so we need to return undefined to
    // avoid showing a notification bubble, when there are no new messages
    if ($newCount < 1) {
      return undefined;
    }
    return `${$newCount}`;
  }
  return undefined;
});
</script>

{#if $isActive}
  <a
    href="/inbox"
    style="display:block; position:relative"
    aria-label={t("navigation:inbox")}
  >
    <cn-navigation-icon
      noun="send"
      label={t("navigation:inbox")}
      notification={count}
    ></cn-navigation-icon>
  </a>
{/if}
