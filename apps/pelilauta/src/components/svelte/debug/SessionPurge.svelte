<script lang="ts">
import { logDebug, logError } from 'src/utils/logHelpers';

// Component state
let isPurging = $state(false);
let isComplete = $state(false);
let logs = $state<string[]>([]);

function addLog(message: string) {
  logs = [...logs, message];
  logDebug('SessionPurge', message);
}

async function purgeSession() {
  if (
    !confirm(
      'Are you sure you want to purge all session data? This will log you out and reset all local settings.',
    )
  ) {
    return;
  }

  isPurging = true;
  logs = [];
  addLog('Starting session purge...');

  try {
    // 1. Clear Cookies
    addLog('Clearing cookies...');
    if ('cookieStore' in window) {
      // Use modern Cookie Store API
      try {
        const cookies = await cookieStore.getAll();
        for (const cookie of cookies) {
          await cookieStore.delete(cookie.name);
          addLog(`Deleted cookie: ${cookie.name}`);
        }
      } catch (e) {
        addLog('Error using Cookie Store API, falling back to legacy method');
        // Fallback to legacy method
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      }
    } else {
      // Fallback for browsers without Cookie Store API
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    }

    // 2. Clear LocalStorage
    addLog('Clearing localStorage...');
    localStorage.clear();

    // 3. Clear SessionStorage
    addLog('Clearing sessionStorage...');
    sessionStorage.clear();

    // 4. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      addLog('Unregistering service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        addLog(`Unregistered SW: ${registration.scope}`);
      }
    }

    // 5. Delete Caches
    if ('caches' in window) {
      addLog('Deleting caches...');
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
        addLog(`Deleted cache: ${key}`);
      }
    }

    // 6. Delete IndexedDB Databases
    if ('indexedDB' in window) {
      addLog('Deleting IndexedDB databases...');
      // Note: indexedDB.databases() is not supported in all browsers (e.g. Firefox)
      // We will try to use it if available, otherwise we rely on known DB names if we had them (we don't strictly here)
      // But for now we will try the API.
      // If the API is not available, we can't easily list all DBs to delete them without knowing their names.
      // However, for this PBI, we will try to use the API and catch errors.

      try {
        // @ts-expect-error - databases() might not be in the TS definition for all environments
        const dbs = await window.indexedDB.databases();
        if (dbs) {
          for (const db of dbs) {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
              addLog(`Deleted IndexedDB: ${db.name}`);
            }
          }
        }
      } catch (e) {
        addLog(
          'Could not list IndexedDB databases (browser may not support it).',
        );
        // Fallback: Try to delete known databases if we knew them.
        // For now, we'll just log the limitation.
        // Common Firebase DBs: 'firebase-heartbeat-database', 'firebase-installations-database', 'firestore/[project-id]/[db-name]/main'
      }
    }

    addLog('Purge complete.');
    isComplete = true;
  } catch (error) {
    logError('SessionPurge', 'Error during purge:', error);
    addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    isPurging = false;
  }
}
</script>

<section class="elevation-1 border-radius p-2">
  <h2>Session Purge</h2>

  {#if isComplete}
    <div class="text-center p-2">
      <h3 class="text-high">Purge Complete</h3>
      <p>All local session data has been cleared.</p>
      <div class="p-2">
        <a href="/" class="button">Return to Front Page</a>
      </div>

      <div
        class="text-low text-left mt-2 p-1 border radius-s"
        style="background: rgba(0,0,0,0.1); font-family: monospace; font-size: 0.8em;"
      >
        {#each logs as log}
          <div>{log}</div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="content-columns">
      <div class="column-l">
        <p class="text-high">Warning: This action is destructive.</p>
        <p>It will:</p>
        <ul class="list-disc pl-4">
          <li>Log you out of the application</li>
          <li>Clear all local settings and preferences</li>
          <li>Remove all cached data and assets</li>
          <li>Reset the application state entirely</li>
        </ul>

        <p class="mt-2">
          Use this if you are experiencing persistent issues, loading loops, or
          "white screens".
        </p>
      </div>
    </div>

    <div class="toolbar justify-end mt-2">
      <button onclick={purgeSession} disabled={isPurging} class="button-warn">
        {#if isPurging}
          <cn-loader></cn-loader>
        {/if}
        <span>Purge Session & Reset</span>
      </button>
    </div>

    {#if logs.length > 0}
      <div
        class="text-low text-left mt-2 p-1 border radius-s"
        style="background: rgba(0,0,0,0.1); font-family: monospace; font-size: 0.8em;"
      >
        {#each logs as log}
          <div>{log}</div>
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .button-warn {
    --background-color: var(--cn-color-status-error);
    --text-color: var(--cn-color-on-status-error);
  }
</style>
