<script lang="ts">
import CnAvatar from '@design-system/components/CnAvatar.svelte';
import type { Profile } from 'src/schemas/ProfileSchema';

type Props = {
  profile: Profile;
};

const { profile }: Props = $props();
</script>

<article class="profile-section">
  <CnAvatar src={profile.avatarURL} nick={profile.nick} size="large" aria-hidden />

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
        >
          {link.label}
        </a>
      {/each}
    </div>
  {/if}
</article>

<style>
  /*
   * The Triad container places this article and reaches no deeper, so the interval
   * between the avatar, the name, the bio and the links is stated here.
   */
  .profile-section {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
