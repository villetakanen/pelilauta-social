<script lang="ts">
import type { Channel } from 'src/schemas/ChannelSchema';
import { t } from 'src/utils/i18n';

interface Props {
  channels: Channel[];
  channelKey?: string;
  disabled?: boolean;
  /**
   * Optional: the editor shell derives dirtiness from this select's value, so a
   * consumer that only wanted to know it changed no longer has to be told.
   */
  onchange?: (event: Event) => void;
}

const { channels, channelKey, disabled = false, onchange }: Props = $props();
</script>

<label>
  {t('entries:thread.channel')}
  <select
    name="channel"
    {onchange}
    {disabled}
  >
    {#each channels as channel}
    <option
      value={channel.slug}
      selected={!!channelKey && channel.slug === channelKey}
    >
      {channel.name}
    </option>
  {/each}
  </select>
</label>