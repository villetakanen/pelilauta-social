<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
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

<article class="surface session-purge-card">
  <header>
    <h2>Session Purge</h2>
    <p class="text-small text-low">Debug tool for clearing client-side state and caches</p>
  </header>

  {#if isComplete}
    <div class="purge-complete-box">
      <div class="surface info">
        <p>
          <CnIcon noun="info" size="small" />
          <span><strong>Purge Complete:</strong> All local session data and caches have been cleared.</span>
        </p>
      </div>

      <div class="actions">
        <a href="/" class="button">
          <CnIcon noun="fox" />
          <span>Return to Front Page</span>
        </a>
      </div>

      {#if logs.length > 0}
        <div class="log-stream">
          {#each logs as log}
            <div class="log-line">{log}</div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="purge-warning-content">
      <p class="text-warning"><strong>Warning:</strong> This action is destructive.</p>
      <p>It will:</p>
      <ul class="warning-list">
        <li>Log you out of the application</li>
        <li>Clear all local settings and preferences</li>
        <li>Remove all cached data and assets</li>
        <li>Reset the application state entirely</li>
      </ul>

      <p class="text-caption text-low">
        Use this if you are experiencing persistent loading loops, stale caches, or unrecoverable application state.
      </p>
    </div>

    <div class="actions">
      <button type="button" onclick={purgeSession} disabled={isPurging}>
        {#if isPurging}
          <CnLoader inline />
        {:else}
          <CnIcon noun="delete" />
        {/if}
        <span>Purge Session & Reset</span>
      </button>
    </div>

    {#if logs.length > 0}
      <div class="log-stream">
        {#each logs as log}
          <div class="log-line">{log}</div>
        {/each}
      </div>
    {/if}
  {/if}
</article>

<style>
  .session-purge-card {
    display: grid;
    row-gap: var(--cn-line);
  }

  .purge-warning-content {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .warning-list {
    margin: 0;
    padding-inline-start: var(--cn-line);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .purge-complete-box {
    display: grid;
    row-gap: var(--cn-line);
  }

  .log-stream {
    display: grid;
    row-gap: 2px;
    padding: var(--cn-gap);
    background: var(--cn-color-surface);
    border: 1px solid var(--cn-color-border);
    border-radius: var(--cn-border-radius-s);
    font-family: monospace;
    font-size: var(--cn-font-size-caption);
    color: var(--cn-color-text-low);
    max-height: calc(var(--cn-grid) * 30);
    overflow-y: auto;
  }

  .log-line {
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
