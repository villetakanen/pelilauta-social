# PBI-067: E2E Tests for Notification & Inbox Features (PBIs 64-66)

## Goal
Create E2E tests to verify notification and inbox features (PBIs 64, 65, 66) using programmatic Firebase authentication for faster, more reliable multi-user scenarios.

## Problem
- No E2E coverage for notification system or inbox functionality
- Current UI-based authentication adds ~5-10 seconds overhead per test file
- Multi-user scenarios (required for testing notifications) would be slow and flaky with UI-based auth

## Scope
Create **selective** programmatic auth for new tests only:
- New helper `authenticate-programmatic.ts` for Firebase REST API auth
- E2E tests for inbox and notification features
- Keep existing `authenticate-e2e.ts` unchanged for backward compatibility

## Features to Test

### PBI-064: Reply Reaction Title
**Scenario**: When User B loves User A's reply, User A receives notification with content snippet (not raw key)
- User A posts a reply
- User B loves the reply
- User A checks inbox → notification shows reply content snippet

### PBI-065: Multi-owner Notification Skip
**Scenario**: Thread co-owners do not receive notifications for their own replies
- User A creates a thread (owner)
- Manually add User B as co-owner via Firestore (or future API)
- User B posts reply → User A should NOT receive notification

### PBI-066: Inbox Relative Timestamps
**Scenario**: Inbox shows relative timestamps like "5 minutes ago"
- Navigate to `/inbox`
- Verify timestamps display relative format (not ISO dates)

## Technical Implementation

### Phase 1: Programmatic Auth Helper

#### [NEW] `e2e/authenticate-programmatic.ts`

Create a new authentication helper that:
1. Uses Firebase REST API (`identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`)
2. Generates Firebase localStorage structure manually
3. Injects auth state into Playwright page context

**Key differences from PBI-053**:
- ❌ No global setup (keeps it simple)
- ❌ No `storageState` file persistence
- ✅ Per-test programmatic injection (flexible for multi-user scenarios)
- ✅ Coexists with existing `authenticate-e2e.ts`

**Function signature**:
```typescript
export async function authenticateProgrammatic(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void>
```

**Implementation steps**:
1. POST to Firebase REST API with email/password
2. Extract `idToken`, `refreshToken`, `localId`, `expiresIn`
3. Construct Firebase localStorage JSON:
   ```typescript
   const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
   const value = {
     uid: localId,
     email,
     refreshToken,
     apiKey,
     appName: '[DEFAULT]',
     createdAt: Date.now().toString(),
     stsTokenManager: {
       accessToken: idToken,
       refreshToken,
       expirationTime: Date.now() + parseInt(expiresIn) * 1000,
     },
   };
   ```
4. Inject into page: `await page.addInitScript(...)` or `page.evaluate()`
5. Navigate to target page

#### [MODIFY] `src/firebase/client/index.ts`

Force localStorage persistence for test environment:
```typescript
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';

export const auth = getAuth(app);

// Force localStorage for E2E tests (Playwright cannot capture IndexedDB)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setPersistence(auth, browserLocalPersistence);
}
```

### Phase 2: E2E Test Files

#### [NEW] `e2e/notifications.spec.ts`

Test notification generation and content:
- Test 1: Reply reaction shows content snippet (PBI-064)
- Test 2: Multi-owner thread skips self-notification (PBI-065)

**Multi-user pattern**:
```typescript
test('Reply reaction notification shows content snippet', async ({ browser }) => {
  // Create two separate contexts for two users
  const userAContext = await browser.newContext();
  const userBContext = await browser.newContext();
  const userAPage = await userAContext.newPage();
  const userBPage = await userBContext.newPage();

  // Authenticate both users programmatically
  await authenticateProgrammatic(userAPage, existingUser);
  await authenticateProgrammatic(userBPage, testUser2);

  // User A creates thread and posts reply
  // ... test implementation
});
```

#### [NEW] `e2e/inbox.spec.ts`

Test inbox UI and timestamp display:
- Test 1: Inbox displays notifications (smoke test)
- Test 2: Timestamps are relative (PBI-066)

**Implementation**:
```typescript
test('Inbox shows relative timestamps', async ({ page }) => {
  await authenticateProgrammatic(page, existingUser);
  await page.goto('/inbox');

  // Find a notification timestamp element
  const timestamp = page.locator('.notification-item .text-caption').first();
  const text = await timestamp.textContent();

  // Should match relative format patterns
  expect(text).toMatch(/(ago|sitten|eilen|yesterday|minuuttia|tunti)/i);
  expect(text).not.toMatch(/^\d{4}-\d{2}-\d{2}/); // Not ISO date
});
```

#### [NEW] `e2e/test-users.ts`

Export test user credentials (imports from gitignored `credentials.ts`):
```typescript
export { existingUser, newUser } from '../playwright/.auth/credentials.ts';

// For multi-user tests, define second test user
export const testUser2 = {
  email: process.env.TEST_USER_2_EMAIL || 'testuser2@example.com',
  password: process.env.TEST_USER_2_PASSWORD || 'testpassword',
};
```

### Phase 3: Environment Setup

#### [MODIFY] `.env.example`

Add Firebase API key for programmatic auth:
```bash
# E2E Testing (Programmatic Auth)
PUBLIC_apiKey=your-firebase-api-key
TEST_USER_2_EMAIL=testuser2@example.com
TEST_USER_2_PASSWORD=testpassword
```

## Acceptance Criteria

### Programmatic Auth
- [ ] `authenticate-programmatic.ts` successfully authenticates via Firebase REST API
- [ ] Auth state is injected into page localStorage
- [ ] Page recognizes user as authenticated (no login prompt)
- [ ] Helper works alongside existing `authenticate-e2e.ts` (no breaking changes)

### E2E Tests - Notifications
- [ ] Test verifies reply reaction notifications show content snippet
- [ ] Test verifies multi-owner notification skipping
- [ ] Tests use programmatic auth for both users

### E2E Tests - Inbox
- [ ] Test verifies inbox page loads and displays notifications
- [ ] Test verifies timestamps are in relative format (not ISO dates)

### Performance
- [ ] Programmatic auth completes in \<1 second (vs 5-10s UI-based)
- [ ] Multi-user tests complete within reasonable time

## Verification Steps

### Manual Testing
1. Run `pnpm test:e2e e2e/notifications.spec.ts`
2. Verify tests pass and execute quickly
3. Check test output shows proper multi-user authentication

### CI Integration
1. Ensure CI has required environment variables:
   - `PUBLIC_apiKey`
   - `TEST_USER_2_EMAIL` / `TEST_USER_2_PASSWORD`
2. Run full E2E suite to verify no regressions

## Out of Scope
- ❌ Replacing existing UI-based auth tests (keep backward compatibility)
- ❌ Global setup script (PBI-053 approach)
- ❌ Migrating all tests to programmatic auth
- ❌ Creating UI for multi-owner thread management (use Firestore direct manipulation)

## References
- PBI-053: Programmatic Auth Playwright (inspiration)
- PBI-064: Reply Reaction Missing Title
- PBI-065: Multi-owner Notification Skip
- PBI-066: Inbox Relative Timestamps
- Firebase REST API: https://firebase.google.com/docs/reference/rest/auth

## Notes
- This is a **selective implementation** of programmatic auth
- Existing tests continue using `authenticate-e2e.ts`
- New pattern is opt-in for scenarios that benefit from it
- Multi-user scenarios can create separate browser contexts per user
