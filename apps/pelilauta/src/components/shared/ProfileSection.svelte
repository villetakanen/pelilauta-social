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

  <p class="text-center">
    <strong>{profile.nick}</strong><br />
    <span class="text-small text-low">{profile.username}</span>
  </p>
  {#if profile.bio}
    <p class="text-small">
      {profile.bio}
    </p>
  {/if}

  {#if profile.links && profile.links.length > 0}
    <div class="links-list">
      {#each profile.links as link}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="button link-button"
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
    justify-items: center;
  }

  .profile-section > p {
    margin: 0;
    inline-size: 100%;
  }

  .links-list {
    display: grid;
    row-gap: var(--cn-grid);
    inline-size: 100%;
  }

  .link-button {
    inline-size: 100%;
    text-align: center;
  }
</style>
