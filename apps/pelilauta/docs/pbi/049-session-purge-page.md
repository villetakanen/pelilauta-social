# PBI-049: Semi-hidden Session Purge Page

## Goal
Create a "semi-hidden" page that allows a user to completely reset their client-side state via a single button interaction. This is intended for testing, error triage, and fixing stuck browser states in production (e.g., "works on my machine" but broken for user due to stale cache/workers).

## Requirements

### 1. Access
- The page should be "semi-hidden". It does not need to be in the main navigation menu.
- Suggested Route: `/debug/purge` or `/purge`.
- It should be accessible to any user (logged in or guest) who knows the URL, as it only affects their local browser state.

### 2. Functionality
The "Purge" action must clear all forms of client-side persistence and caching:
- **Cookies**: Clear all accessible cookies.
- **Local Storage**: `localStorage.clear()`
- **Session Storage**: `sessionStorage.clear()`
- **Service Workers**: Unregister any active service workers to ensure fresh asset fetching on next load.
- **Cache API**: Iterate through `caches.keys()` and delete all caches (used by SW or other fetch caching).
- **IndexedDB**: Delete the application's IndexedDB databases (e.g., Firebase persistence, local app state).

### 3. User Interface
- A simple, distraction-free page.
- A clear warning that this action will log them out and reset all local preferences/caches.
- A single, prominent "Purge Session" button.
- After purging, the page should display a "Purge Complete" message and provide a link to the front page (instead of automatically reloading).

## Use Cases
- **QA/Testing**: Quickly resetting state between test runs without manually clearing browser data.
- **Error Triage**: Helping users who are experiencing "white screen" or loading loops (like the recent iOS/Windows login issues) by giving them a link to a "hard reset".
- **Regression Fixing**: Recovering from bad deployments where stale assets or state schemas might be stuck in the user's browser.

## Technical Considerations
- Ensure the code handles errors gracefully (e.g., if clearing a specific storage fails, continue clearing the others).
- For IndexedDB, we need to know the database names or use `window.indexedDB.databases()` (if supported) to list and delete them.
- Firebase Auth persistence is often in IndexedDB or LocalStorage, so this will effectively log the user out.
