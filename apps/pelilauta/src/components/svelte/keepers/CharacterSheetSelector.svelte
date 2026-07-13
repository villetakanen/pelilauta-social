<script lang="ts">
import { authedGet } from '@firebase/client/apiClient';
import type { CharacterSheet } from '@schemas/CharacterSheetSchema';
import { authUser, uid } from '@stores/session';
import { t } from '@utils/i18n';
import { onMount } from 'svelte';

interface Props {
  system: string;
  selectedSheetKey: string;
  setSelectedSheetKey: (key: string) => void;
}

const { system, selectedSheetKey, setSelectedSheetKey }: Props = $props();

let sheets = $state<CharacterSheet[]>([]);

async function fetchSheets() {
  console.log(
    '[CharacterSheetSelector] Starting fetchSheets for system:',
    system,
  );

  // Check authentication state - use reactive store values
  console.log(
    '[CharacterSheetSelector] Auth state - uid:',
    $uid,
    'authUser:',
    $authUser,
  );

  if (!$uid || !$authUser) {
    console.warn(
      '[CharacterSheetSelector] Not authenticated, skipping API call. uid:',
      !!$uid,
      'authUser:',
      !!$authUser,
    );
    return;
  }

  try {
    console.log(
      '[CharacterSheetSelector] Making API call to:',
      `/api/character-sheets?system=${system}`,
    );

    const response = await authedGet(`/api/character-sheets?system=${system}`);

    console.log('[CharacterSheetSelector] Raw API response:', response);
    console.log('[CharacterSheetSelector] Response status:', response.status);
    console.log('[CharacterSheetSelector] Response ok:', response.ok);

    const data = await response.json();
    console.log('[CharacterSheetSelector] Parsed response data:', data);

    if (data?.sheets) {
      sheets = data.sheets;
      console.log(`[CharacterSheetSelector] Set ${data.sheets.length} sheets`);
    } else {
      console.warn('[CharacterSheetSelector] No sheets found in response data');
    }
  } catch (error) {
    console.error('[CharacterSheetSelector] Error fetching sheets:', error);
  }
}

// Use effect pattern to watch authentication state changes
$effect(() => {
  console.log(
    '[CharacterSheetSelector] Effect triggered - uid:',
    $uid,
    'authUser:',
    !!$authUser,
    'system:',
    system,
  );

  if ($uid && $authUser) {
    // Safe to make API calls - Firebase auth is fully initialized
    console.log(
      '[CharacterSheetSelector] Auth ready, fetching sheets for system:',
      system,
    );
    fetchSheets();
  } else if (!$uid) {
    // User logged out, clear sheets
    console.log('[CharacterSheetSelector] User logged out, clearing sheets');
    sheets = [];
  }
  // For other states (uid but no authUser), wait - don't make API calls
});
</script>

<div class="select-wrapper">
    <select onchange={(e) => setSelectedSheetKey(e.currentTarget.value)} value={selectedSheetKey}>
        <option value="">{t('site:options.selectSheet')}</option>
        {#each sheets as sheet}
            <option value={sheet.key}>{sheet.name}</option>
        {/each}
    </select>
</div>
