<script lang="ts">
import type { Profile } from 'src/schemas/ProfileSchema';

type Props = {
  profile: Profile;
};

const { profile }: Props = $props();
</script>

<article
  class="column-s flex"
  style="flex-direction: column; align-items: center;"
>
  <cn-avatar src={profile.avatarURL} alt={profile.nick}></cn-avatar>

  <p class="m-0 text-center">
    <strong>{profile.nick}</strong><br />
    <span class="text-small">{profile.username}</span>
  </p>
  <p class="small">
    {profile.bio}
  </p>

  {#if profile.links && profile.links.length > 0}
    <div class="flex flex-col gap-1 w-full mt-2">
      {#each profile.links as link}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="button small w-full"
          style="justify-content: center;"
        >
          {link.label}
        </a>
      {/each}
    </div>
  {/if}
</article>
