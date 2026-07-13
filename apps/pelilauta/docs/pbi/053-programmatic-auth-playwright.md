# PBI-053: Optimize Playwright E2E Suite with Programmatic Firebase Authentication

## 1. Context & Problem

**Current State:** The current End-to-End (E2E) test suite in `pelilauta-17` performs authentication via the UI (filling forms, clicking buttons) for every test file. **Issues:**

- **Performance:** UI login adds ~5-10 seconds of overhead per test file, significantly slowing down CI.
    
- **Flakiness:** UI interactions are prone to network jitter or animation delays.
    
- **Maintenance:** Changes to the login UI break unrelated tests.
    

## 2. Objective

Replace UI-based login with **Programmatic Authentication** using Playwright's Global Setup. We will communicate directly with the Firebase REST API to generate a session, inject the authentication state into `localStorage`, and reuse this state across all worker processes.

## 3. Technical Implementation Plan

### A. App-Side Change (Prerequisite)

Firebase Auth defaults to `IndexedDB` in newer versions, which Playwright's `storageState` cannot easily capture. We must force `localStorage` in the test environment.

- **Action:** Modify the Firebase initialization logic.
    
- **Logic:** `if (window.location.hostname === 'localhost') { setPersistence(auth, browserLocalPersistence); }`
    

### B. Create Global Setup Script

Create a new file `tests/auth.setup.ts` that runs before the test suite.

**Pseudocode/Logic:**

1. **Endpoint:** POST to `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]`
    
2. **Payload:** `{ email: 'test@example.com', password: '...', returnSecureToken: true }`
    
3. **Storage Generation:** Construct the Firebase-specific LocalStorage JSON blob manually.
    
    - _Key format:_ `firebase:authUser:[API_KEY]:[APP_NAME]`
        
    - _Value:_ JSON string containing `uid`, `accessToken` (idToken), `refreshToken`, and `expirationTime`.
        
4. **Output:** Save to `playwright/.auth/user.json`.
    

### C. Configure Playwright

Update `playwright.config.ts`:

1. Add a `setup` project that runs `tests/auth.setup.ts`.
    
2. Add `storageState: 'playwright/.auth/user.json'` to the main browser projects.
    
3. Ensure main projects have `dependencies: ['setup']`.
    

### D. Refactor Existing Tests

Remove all `beforeEach` hooks or `loginPage.login()` calls from individual `*.spec.ts` files. Tests should assume the user is already authenticated upon `page.goto('/')`.

## 4. Acceptance Criteria

- [ ] `auth.setup.ts` is created and successfully retrieves a Firebase token via REST API.
    
- [ ] `playwright.config.ts` is configured to run setup before tests.
    
- [ ] User session is successfully persisted to `localStorage` and read by the app (user is logged in on load).
    
- [ ] All `login()` UI steps are removed from individual test files.
    
- [ ] CI execution time is reduced (Target: >30% reduction).
    

## 5. Reference Material (Firebase JSON Structure)

_Note: This structure is strict. The app will not recognize the user if fields are missing._

```javascript
const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
const value = {
  uid: body.localId,
  email: body.email,
  refreshToken: body.refreshToken,
  apiKey: apiKey,
  appName: '[DEFAULT]',
  createdAt: Date.now().toString(),
  stsTokenManager: {
    accessToken: body.idToken,
    refreshToken: body.refreshToken,
    expirationTime: Date.now() + parseInt(body.expiresIn) * 1000,
  },
};
```
