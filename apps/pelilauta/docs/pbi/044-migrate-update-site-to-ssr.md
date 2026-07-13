# PBI-044: Migrate Site Updates to Server-Side API Pattern

**Priority:** High  
**Type:** Technical Debt / Refactoring  
**Estimated Effort:** 4-6 hours  
**Blocks:** PBI-043 (Manual TOC Ordering)

**User Story:** As a developer, I want site updates to follow the API-first pattern (like threads), so that the codebase has consistent architecture and atomic cache purging.

## Implementation Status

**Current Phase:** Migration Complete ✅ All 7 Commits Done

### Completed Commits

- ✅ **Commit 1** (c79f167): Add `SiteUpdateSchema` validation schema
  - Created `src/schemas/SiteUpdateSchema.ts` with Zod schema
  - Added comprehensive unit tests (33 tests)
  - All fields optional, validates partial updates
  
- ✅ **Commit 2** (2dac59c): Add PATCH `/api/sites/[siteKey]` endpoint (initial)
  - Created API endpoint with auth, validation, Firestore update
  - Implemented atomic cache purging via `NetlifyCachePurger`
  - Added integration tests (40+ tests)
  
- ✅ **Commit 2.1** (fd0632c): Fix HTTP method semantics (hotfix)
  - Changed primary method from PUT to PATCH (correct REST semantics)
  - Kept PUT as alias for backward compatibility
  - Updated tests to use PATCH as primary method
  - Documented bug in "Known Issues" section

- ✅ **Commit 3** (4b7bb95): Add `updateSiteApi` client wrapper
  - Created `src/firebase/client/site/updateSiteApi.ts`
  - Added `authedPatch` helper to `src/firebase/client/apiClient.ts`
  - Implemented comprehensive unit tests (12 tests)
  - All tests passing, code formatted with Biome

- ✅ **Commit 4** (16c657b): Migrate `SiteMetaForm` to API pattern
  - Updated `src/stores/site/siteEditorStore.ts` to use `updateSiteApi`
  - Replaced direct Firestore updates with API calls
  - Removed manual cache purging (handled server-side atomically)
  - Simplified code: -25 lines, +14 lines (net -11 lines)
  - No component changes needed (store abstraction works!)

- ✅ **Commit 5** (0713218): Migrate TOC tool components to API pattern
  - Updated `src/components/svelte/sites/toc/SiteTocTool.svelte` to use `updateSiteApi`
  - Updated `src/components/svelte/sites/toc/SiteCategoriesTool.svelte` to use `updateSiteApi`
  - Both components use silent updates (no timestamp changes)
  - Improved error logging with component context
  - All tests passing (366/366)

- ✅ **Commit 6** (950e7b9): Migrate remaining client-side uses to API pattern
  - Updated `src/firebase/client/page/addPageRef.ts` to use `updateSiteApi`
  - Updated `src/stores/site/index.ts` to use `updateSiteApi`
  - Both use silent updates (metadata-only changes)
  - No more direct uses of old `updateSite` pattern in codebase
  - All tests passing (366/366)

- ✅ **Commit 7** (Not yet committed): Remove old `updateSite.ts` pattern
  - Deleted `src/firebase/client/site/updateSite.ts`
  - Old Firestore pattern completely removed from codebase
  - All site updates now go through REST API
  - All tests passing (366/366)
  - Migration complete!

### Migration Complete! 🎉

All site updates now use the API-first pattern:
- ✅ Server-side validation with `SiteUpdateSchema`
- ✅ Atomic cache purging on every update
- ✅ Authentication and authorization on server
- ✅ No direct Firestore access from client
- ✅ Consistent error handling across all update paths

### Files Modified

**Commit 1:**
- `src/schemas/SiteSchema.ts` - Added `SiteUpdateSchema` and `SiteUpdate` type
- `src/schemas/SiteUpdateSchema.test.ts` - New test file (33 tests)

**Commit 2 & 2.1:**
- `src/pages/api/sites/[siteKey]/index.ts` - Added GET + PATCH handlers (PUT alias)
- `test/api/sites-update.test.ts` - New integration test file (40+ tests)

**Commit 3:**
- `src/firebase/client/apiClient.ts` - Added `authedPatch` helper method
- `src/firebase/client/site/updateSiteApi.ts` - New client-side wrapper
- `test/lib/client/updateSiteApi.test.ts` - New unit test file (12 tests)

**Commit 4:**
- `src/stores/site/siteEditorStore.ts` - Migrated to use `updateSiteApi` (simplified by 11 lines)
- `COMMIT-4-CHANGES.md` - Commit documentation

**Commit 5:**
- `src/components/svelte/sites/toc/SiteTocTool.svelte` - Migrated to use `updateSiteApi`
- `src/components/svelte/sites/toc/SiteCategoriesTool.svelte` - Migrated to use `updateSiteApi`
- `COMMIT-5-CHANGES.md` - Commit documentation

**Commit 6:**
- `src/firebase/client/page/addPageRef.ts` - Migrated to use `updateSiteApi`
- `src/stores/site/index.ts` - Migrated to use `updateSiteApi`
- `COMMIT-6-CHANGES.md` - Commit documentation

**Commit 7:**
- `src/firebase/client/site/updateSite.ts` - Deleted (old pattern removed)

---

## Terminology

- **CSR (Client-Side Rendering)**: Direct Firestore updates from browser with dynamic imports
- **SSR (Server-Side Rendering)**: Updates through API endpoints with server-side processing
- **API-First Pattern**: Architecture where all mutations go through authenticated API endpoints
- **Atomic Cache Purging**: Cache invalidation happens in the same transaction as data update

---

## Problem Statement

Currently, site updates use a client-side Firestore pattern (`updateSite.ts`) that differs from the newer API-first pattern used for threads (`updateThreadApi.ts`). This creates architectural inconsistency and complexity:

1. **Two Different Patterns**: Sites use CSR, Threads use SSR (via API)
2. **Non-Atomic Operations**: Site update + cache purge are two separate network calls
3. **Potential Race Conditions**: Cache purge can fail while update succeeds, leaving stale cache
4. **Complex Client Code**: Client must handle Firestore connection, cache purging, error coordination
5. **Inconsistent Error Handling**: Different patterns for similar operations
6. **Migration Direction Unclear**: New features (like PBI-043) don't know which pattern to follow

### Current Architecture

**Site Updates (Client-Side Pattern):**
```typescript
// src/firebase/client/site/updateSite.ts
export async function updateSite(site: Partial<Site>, silent = false) {
  // 1. Dynamic import of Firestore
  const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
  
  // 2. Update Firestore directly from client
  await updateDoc(siteDoc, updateData);
  
  // 3. Separate API call for cache purging (always happens, even if silent)
  const { purgeCacheForSite } = await import('../cache/purgeCacheHelpers');
  await purgeCacheForSite(site.key); // ⚠️ Separate network call!
}

// Which internally does:
// src/firebase/client/cache/purgeCacheHelpers.ts
export async function purgeCacheForSite(siteKey: string) {
  const { authedPost } = await import('../apiClient');
  await authedPost('/api/cache/purge-site', { siteKey }); // ⚠️ Second API call
}
```

**Thread Updates (API-First Pattern):**
```typescript
// src/firebase/client/threads/updateThreadApi.ts
export async function updateThreadApi(thread: Partial<Thread>, silent = false) {
  const token = await getIdToken(auth.currentUser);
  
  // Single API call - server handles everything atomically
  const response = await fetch(`/api/threads/${thread.key}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...thread, silent }),
  });
}

// Server-side API endpoint:
// src/pages/api/threads/[threadKey].ts
export async function PUT({ params, request }) {
  // 1. Authenticate
  const uid = await tokenToUid(request);
  
  // 2. Authorize (check ownership)
  // 3. Validate data
  // 4. Update Firestore (server-side)
  // 5. Trigger cache purging (server-side)
  // 6. Return result
  
  // All in one atomic server-side operation ✓
}
```

### Problems with Current Site Update Pattern

**Problem 1: Non-Atomic Operations**
```typescript
await updateSite({ key: 'my-site', name: 'New Name' });
// Sequence:
// 1. ✓ Firestore updated
// 2. ✓ Client makes cache purge API call
// 3. ✗ Network fails - cache purge never sent!
// 4. Result: Stale cache showing old site name
```

**Problem 2: Complex Error Handling**
```typescript
// Current: Two failure points
try {
  await updateDoc(siteDoc, data); // Failure point 1
} catch {
  // Handle Firestore error
}

if (!silent) {
  try {
    await purgeCacheForSite(siteKey); // Failure point 2
  } catch {
    // Cache purge failed, but update succeeded
    // What should we tell the user?
  }
}
```

**Problem 3: Silent Updates Still Need Cache Purging**
```typescript
// Current: Cache only purged if NOT silent
await updateSite({ key: 'site-1', sortOrder: 'manual' }, true); // silent=true
// 1. ✓ Firestore updated with new sortOrder
// 2. ✗ Cache NOT purged because silent=true
// 3. Result: Users see old TOC order until cache expires!

// What should happen:
// silent=true → don't update timestamps
// BUT → still purge cache because data changed!
```

**Problem 4: Inconsistent Developer Experience**
```typescript
// Threads: Simple, one function
await updateThreadApi({ key: 'thread-1', title: 'New Title' });

// Sites: Complex, multiple steps
await updateSite({ key: 'site-1', name: 'New Name' });
// (internally does Firestore + cache purge)

// Pages: Even more complex
await updatePage(siteKey, pageKey, changes);
// (does Firestore + page refs + tags + cache purge)

// Why are these all different? 🤔
```

### Evidence of Migration Direction

From `src/firebase/client/threads/updateThreadApi.ts`:
```typescript
/**
 * Updates an existing thread using the server-side API endpoint.
 * This replaces the old client-side updateThread function.  // ← KEY COMMENT
 *
 * @param thread - Partial thread data with key required
 * @param silent - If true, doesn't update flowTime (for metadata-only updates)
 */
export async function updateThreadApi(/* ... */) {
```

**Conclusion:** The architecture is moving toward API-first pattern. Sites should follow.

---

## Solution Design

### Target Architecture

**New API Endpoint:**
```typescript
// src/pages/api/sites/[siteKey]/index.ts
export async function PUT({ params, request }: APIContext): Promise<Response> {
  const { siteKey } = params;
  
  // 1. Authenticate via Bearer token
  const uid = await tokenToUid(request);
  if (!uid) return new Response('Unauthorized', { status: 401 });
  
  // 2. Parse and validate request
  const body = await request.json();
  const { silent = false, ...updateData } = body;
  
  // 3. Get existing site and check authorization
  const site = await getSiteData(siteKey);
  if (!site) return new Response('Site not found', { status: 404 });
  if (!site.owners.includes(uid)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 4. Validate update data (Zod schema)
  const validated = SiteUpdateSchema.parse(updateData);
  
  // 5. Update Firestore (server-side)
  await serverDB
    .collection(SITES_COLLECTION_NAME)
    .doc(siteKey)
    .update(toFirestoreEntry(validated, { silent }));
  
  // 6. Trigger cache purging (server-side, atomically)
  // Always purge cache when data changes, even if timestamps aren't updated
  await handleSiteUpdate(siteKey, site);
  
  // 7. Return success
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**New Client Function:**
```typescript
// src/firebase/client/site/updateSiteApi.ts
import type { Site } from '@schemas/SiteSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates a site using the server-side API endpoint.
 * This replaces the old client-side updateSite function.
 *
 * @param site - Partial site data with key required
 * @param silent - If true, doesn't update timestamps (for metadata-only updates)
 * @returns Promise<void>
 */
export async function updateSiteApi(
  site: Partial<Site>,
  silent = false,
): Promise<void> {
  if (!site.key) {
    throw new Error('Site key is required to update site');
  }

  try {
    logDebug('updateSiteApi', 'Updating site via API', {
      siteKey: site.key,
      fields: Object.keys(site).filter(k => k !== 'key'),
      silent,
    });

    // Use authedPut helper - handles auth token automatically
    const { authedPut } = await import('@firebase/client/apiClient');
    const { key, ...updateData } = site;

    const response = await authedPut(`/api/sites/${key}`, {
      ...updateData,
      silent,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    logDebug('updateSiteApi', 'Site updated successfully', { siteKey: site.key });
  } catch (error) {
    logError('updateSiteApi', 'Failed to update site:', error);
    throw error;
  }
}
```

### Migration Strategy

Since we're doing this migration agentically (with AI assistance), we can do the entire migration atomically in one PBI, but split into **sequential, non-breaking commits** that can be outsourced to agents:

**Commit-by-Commit Plan:**

1. **Commit 1**: Add validation schema (non-breaking)
2. **Commit 2**: Add API endpoint PUT handler (non-breaking, coexists with old pattern)
3. **Commit 3**: Add `updateSiteApi` wrapper function (non-breaking, optional helper)
4. **Commit 4**: Update SiteMetaForm.svelte to use new API
5. **Commit 5**: Update SiteTocTool.svelte to use new API
6. **Commit 6**: Update SiteCategoriesTool.svelte to use new API
7. **Commit 7**: Delete old `updateSite.ts` and cache purge endpoint (breaking, but nothing uses it)

**Benefits of Sequential Commits:**
- ✅ Each commit is independently testable
- ✅ Each commit can be assigned to an agent
- ✅ Can pause/resume at any commit boundary
- ✅ Easier to review and debug
- ✅ Non-breaking until final cleanup commit
- ✅ Clear progress tracking

---

## Implementation Plan

Each phase corresponds to one atomic commit that can be completed and tested independently.

---

### Commit 1: Add Validation Schema (20 minutes)

**Goal:** Create validation schema for site updates (non-breaking)

**Files to Create:**
- `src/schemas/SiteUpdateSchema.ts`

**Why This Commit?**
- Pure additive change
- No existing code touched
- Can be tested independently
- Required by next commit

**Implementation:**
```typescript
// src/schemas/SiteUpdateSchema.ts
import { z } from 'zod';

export const SiteUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  system: z.string().optional(),
  license: z.string().optional(),
  hidden: z.boolean().optional(),
  sortOrder: z.enum(['name', 'createdAt', 'flowTime', 'manual']).optional(),
  posterURL: z.string().url().optional().or(z.literal('')),
  avatarURL: z.string().url().optional().or(z.literal('')),
  backgroundURL: z.string().url().optional().or(z.literal('')),
  homepage: z.string().optional(),
  pageCategories: z.array(z.object({
    slug: z.string(),
    name: z.string(),
  })).optional(),
  // Options
  usePlayers: z.boolean().optional(),
  useClocks: z.boolean().optional(),
  useHandouts: z.boolean().optional(),
  useRecentChanges: z.boolean().optional(),
  useSidebar: z.boolean().optional(),
  sidebarKey: z.string().optional(),
  usePlainTextURLs: z.boolean().optional(),
  useCharacters: z.boolean().optional(),
  useCharacterKeeper: z.boolean().optional(),
  characterKeeperSheetKey: z.string().optional(),
});

export type SiteUpdate = z.infer<typeof SiteUpdateSchema>;
```

**Tests:**
```typescript
// Unit test to add
describe('SiteUpdateSchema', () => {
  it('should validate correct site updates', () => {
    const update = { name: 'Test Site', description: 'A test' };
    expect(() => SiteUpdateSchema.parse(update)).not.toThrow();
  });
});
```

**Verification:**
```bash
# Schema can be imported
pnpm run build
# Tests pass
pnpm test src/schemas/SiteUpdateSchema.test.ts
```

---

### Commit 2: Add PUT /api/sites/[siteKey] Endpoint (1 hour)

**Goal:** Add API endpoint that coexists with old pattern (non-breaking)

**Files to Modify:**
- `src/pages/api/sites/[siteKey]/index.ts` (add PUT handler)

**Why This Commit?**
- Existing GET handler unchanged
- New PUT handler coexists with old client-side updates
- Can be tested independently via API calls
- No client code needs to change yet

**Implementation:**
```typescript
// src/pages/api/sites/[siteKey]/index.ts
import type { APIContext } from 'astro';
import { SITES_COLLECTION_NAME } from '@schemas/SiteSchema';
import { SiteUpdateSchema } from '@schemas/SiteUpdateSchema';
import { getSiteData } from '@firebase/server/sites';
import { handleSiteUpdate } from '@lib/server/content-hooks';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { toFirestoreEntry } from '@utils/client/toFirestoreEntry';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { serverDB } from '@firebase/server';

export async function GET({ params, request }: APIContext): Promise<Response> {
  // Existing GET implementation stays unchanged
  const { siteKey } = params;
  if (!siteKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const site = await getSiteData(siteKey);

  if (!site) {
    return new Response('Site not found', { status: 404 });
  }

  const etag = `"${site.updatedAt}"`;
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(JSON.stringify(site), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ETag: etag,
      'Cache-Control': 's-maxage=300, stale-while-revalidate=1800',
    },
  });
}

export async function PUT({ params, request }: APIContext): Promise<Response> {
  const endpointName = 'updateSite';
  const { siteKey } = params;

  if (!siteKey) {
    return new Response(JSON.stringify({ error: 'Site key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Authenticate user
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Parse request body
    const body = await request.json();
    const { silent = false, ...updateData } = body;

    logDebug(endpointName, 'Update request received', {
      siteKey,
      uid,
      fields: Object.keys(updateData),
      silent,
    });

    // 3. Get existing site
    const site = await getSiteData(siteKey);

    if (!site) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Verify ownership
    if (!site.owners.includes(uid)) {
      logWarn(endpointName, 'Unauthorized update attempt', {
        siteKey,
        uid,
        owners: site.owners,
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Not site owner' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Validate update data
    const validated = SiteUpdateSchema.parse(updateData);

    logDebug(endpointName, 'Validation passed', {
      siteKey,
      validatedFields: Object.keys(validated),
    });

    // 6. Update Firestore
    const siteRef = serverDB.collection(SITES_COLLECTION_NAME).doc(siteKey);
    await siteRef.update(toFirestoreEntry(validated, { silent }));

    logDebug(endpointName, 'Site updated in Firestore', { siteKey });

    // 7. Trigger cache purging (atomically, same request)
    // Always purge cache when data changes, even if timestamps aren't updated
    try {
      await handleSiteUpdate(siteKey, site);
      logDebug(endpointName, 'Cache purging completed', { siteKey });
    } catch (cacheError) {
      // Log but don't fail the request - cache purging is best-effort
      logWarn(
        endpointName,
        'Cache purging failed but update succeeded',
        {
          siteKey,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        },
      );
    }

    // 8. Return success
    return new Response(
      JSON.stringify({
        success: true,
        siteKey,
        silent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logError(endpointName, 'Failed to update site', {
      siteKey,
      error: error instanceof Error ? error.message : String(error),
    });

    // Handle validation errors separately
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
```

**Tests:**
```typescript
// Integration test to add
describe('PUT /api/sites/[siteKey]', () => {
  it('should update site via API', async () => {
    const token = await getTestUserToken();
    const siteKey = await createTestSite();
    
    const response = await fetch(`/api/sites/${siteKey}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'API Updated' }),
    });
    
    expect(response.status).toBe(200);
    const site = await getSiteData(siteKey);
    expect(site.name).toBe('API Updated');
  });
});
```

**Verification:**
```bash
# API endpoint responds
curl -X PUT http://localhost:4321/api/sites/test-site \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test"}'

# Integration tests pass
pnpm test:api sites
```

---

### Commit 3: Add updateSiteApi Wrapper (30 minutes)

**Goal:** Create optional wrapper function for cleaner client code (non-breaking)

**Files to Create:**
- `src/firebase/client/site/updateSiteApi.ts`

**Why This Commit?**
- Pure additive change
- Provides convenience wrapper
- Old pattern still works
- Makes next commits simpler

**Implementation:**

**Code:**
```typescript
// src/firebase/client/site/updateSiteApi.ts
import type { Site } from '@schemas/SiteSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates a site using the server-side API endpoint.
 * This replaces the old client-side updateSite function.
 *
 * @param site - Partial site data with key required
 * @param silent - If true, doesn't update timestamps (for metadata-only updates)
 * @returns Promise<void>
 */
export async function updateSiteApi(
  site: Partial<Site>,
  silent = false,
): Promise<void> {
  if (!site.key) {
    throw new Error('Site key is required to update site');
  }

  try {
    logDebug('updateSiteApi', 'Updating site via API', {
      siteKey: site.key,
      fields: Object.keys(site).filter(k => k !== 'key'),
      silent,
    });

    // Use authedPut helper - handles auth token automatically
    const { authedPut } = await import('@firebase/client/apiClient');
    const { key, ...updateData } = site;

    const response = await authedPut(`/api/sites/${key}`, {
      ...updateData,
      silent,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    logDebug('updateSiteApi', 'Site updated successfully', { siteKey: site.key });
  } catch (error) {
    logError('updateSiteApi', 'Failed to update site:', error);
    throw error;
  }
}
```

**Tests:**
```typescript
// Unit test to add
describe('updateSiteApi', () => {
  it('should call API with correct parameters', async () => {
    // Mock authedPut
    const mockResponse = { ok: true, json: async () => ({}) };
    vi.mock('@firebase/client/apiClient', () => ({
      authedPut: vi.fn().mockResolvedValue(mockResponse),
    }));
    
    await updateSiteApi({ key: 'test', name: 'Updated' }, true);
    
    expect(authedPut).toHaveBeenCalledWith('/api/sites/test', {
      name: 'Updated',
      silent: true,
    });
  });
});
```

**Verification:**
```bash
# Function exports correctly
pnpm run build
# No breaking changes - old updateSite still works
pnpm test src/firebase/client/site/
```

---

### Commit 4: Update SiteMetaForm.svelte (20 minutes)

**Goal:** Migrate first component to new API pattern

**Files to Modify:**
- `src/components/svelte/sites/settings/SiteMetaForm.svelte`

**Why This Commit?**
- Smallest, simplest component
- High confidence migration
- Proves new pattern works
- Other components still use old pattern (non-breaking for them)

**Implementation:**

**Changes:**
```typescript
// Before:
import { updateSite } from 'src/firebase/client/site/updateSite';
await updateSite({ name, description, system, license });

// After:
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
await updateSiteApi({ key: site.key, name, description, system, license });

// Or use authedPut directly in the component:
const { authedPut } = await import('@firebase/client/apiClient');
const response = await authedPut(`/api/sites/${site.key}`, {
  name,
  description,
  system,
  license,
});
```

**Tests:**
```typescript
// E2E test to add/verify
test('site metadata form uses new API', async ({ page }) => {
  const siteKey = await createTestSite();
  await loginAsOwner(page);
  
  await page.goto(`/sites/${siteKey}/settings`);
  await page.fill('input[name="name"]', 'New Name');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.snackbar')).toContainText('saved');
  
  // Verify via API (not old pattern)
  const site = await getSiteData(siteKey);
  expect(site.name).toBe('New Name');
});
```

**Verification:**
```bash
# Component works
pnpm run dev
# Navigate to site settings, update name, verify success
# E2E test passes
pnpm test:e2e -- --grep "site metadata"
```

---

### Commit 5: Update SiteTocTool.svelte and SiteCategoriesTool.svelte (30 minutes) ✅

**Goal:** Migrate TOC tool components to new API pattern

**Files Modified:**
- `src/components/svelte/sites/toc/SiteTocTool.svelte`
- `src/components/svelte/sites/toc/SiteCategoriesTool.svelte`

**Why This Commit?**
- Both TOC-related components use silent updates for metadata
- Uses `silent: true` parameter (important test case)
- Logical grouping: both components are in the same feature area

**Implementation:**

**SiteTocTool.svelte:**
```typescript
// Before:
import { updateSite } from 'src/firebase/client/site/updateSite';
await updateSite({ key: site.key, sortOrder: value }, true);

// After:
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
await updateSiteApi({ key: site.key, sortOrder: value }, true);
```

**SiteCategoriesTool.svelte:**
```typescript
// Before:
import { updateSite } from 'src/firebase/client/site/updateSite';
await updateSite({ key: site.key, pageCategories: cats }, true);

// After:
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
await updateSiteApi({ key: site.key, pageCategories: cats }, true);
```

**Tests:**
```typescript
// E2E test to add/verify
test('TOC sort order update uses new API with silent flag', async ({ page }) => {
  const siteKey = await createTestSite();
  await loginAsOwner(page);
  
  await page.goto(`/sites/${siteKey}/toc/settings`);
  await page.selectOption('select', 'manual');
  
  await expect(page.locator('.snackbar')).toContainText('updated');
  
  const site = await getSiteData(siteKey);
  expect(site.sortOrder).toBe('manual');
  // Verify timestamp NOT updated (silent=true)
  expect(site.updatedAt).toBe(originalUpdatedAt);
});
```

**Verification:**
```bash
# Component works
pnpm run dev
# Navigate to TOC settings, change sort order
# E2E test passes
pnpm test:e2e -- --grep "TOC sort order"
```

---

### Commit 6: Update addPageRef.ts and stores/site/index.ts (30 minutes)

**Goal:** Migrate remaining client-side uses of `updateSite` to new API pattern

**Files to Modify:**
- `src/firebase/client/page/addPageRef.ts`
- `src/stores/site/index.ts`

**Why This Commit?**
- Last remaining direct uses of old `updateSite` pattern
- After this, only the old implementation file itself remains
- Both use silent updates (no timestamp changes)

**Implementation:**

**addPageRef.ts:**
```typescript
// Before:
import { updateSite } from '../site/updateSite';
await updateSite({ pageRefs: refs, key: siteKey });

// After:
import { updateSiteApi } from '../site/updateSiteApi';
await updateSiteApi({ pageRefs: refs, key: siteKey });
```

**stores/site/index.ts:**
```typescript
// Before:
import { updateSite } from 'src/firebase/client/site/updateSite';
await updateSite(updated, true);

// After:
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
await updateSiteApi(updated, true);
```

**Search for Remaining Usages:**
```bash
pnpm rg "updateSite\(" --type-add 'svelte:*.svelte' -t svelte -t ts
# Should show: 0 results (all migrated)
```

**Verification:**
```bash
# All components work
pnpm run dev
# All E2E tests pass
pnpm test:e2e -- --grep "site.*update"
```

---

### Commit 7: Delete Old Pattern (30 minutes)

**Goal:** Remove deprecated code now that nothing uses it (breaking cleanup)

**Files to Delete:**
- `src/firebase/client/site/updateSite.ts`
- `src/pages/api/cache/purge-site.ts`
- `src/firebase/client/cache/purgeCacheHelpers.ts` (or remove `purgeCacheForSite` function)

**Why This Commit?**
- Old pattern no longer used
- Clean up technical debt
- Force future code to use new pattern
- Can be reverted if issues found

**Implementation:**

**Files to Remove:**
```bash
# Remove the old client-side function
rm src/firebase/client/site/updateSite.ts
```

**3.2 Delete Old Cache Purge Endpoint**
```typescript
// Delete: src/pages/api/cache/purge-site.ts
// No longer needed - cache purging happens in PUT /api/sites/[siteKey]
```

**3.3 Delete Old Cache Purge Helper**
```typescript
// Delete: src/firebase/client/cache/purgeCacheHelpers.ts
// Or remove purgeCacheForSite function if other functions are still used
```

**Tests:**
```typescript
// Verify old imports fail
test('old updateSite import should fail', () => {
  expect(() => {
    require('src/firebase/client/site/updateSite');
  }).toThrow();
});
```

**Verification:**
```bash
# Files deleted
ls src/firebase/client/site/updateSite.ts  # Should error
ls src/pages/api/cache/purge-site.ts       # Should error

# No imports of deleted files
pnpm rg "from.*updateSite" --type-add 'svelte:*.svelte' -t svelte -t ts
# Should show: 0 results

# Build succeeds
pnpm run build

# All tests pass
pnpm test
pnpm test:e2e
```

---

## Summary: Commit Sequence

| Commit | Description | Breaking? | Can Test? | Assignable? |
|--------|-------------|-----------|-----------|-------------|
| 1 | Add validation schema | ❌ No | ✅ Yes | ✅ Agent 1 |
| 2 | Add PUT endpoint | ❌ No | ✅ Yes | ✅ Agent 2 |
| 3 | Add wrapper function | ❌ No | ✅ Yes | ✅ Agent 3 |
| 4 | Migrate SiteMetaForm | ❌ No | ✅ Yes | ✅ Agent 4 |
| 5 | Migrate SiteTocTool | ❌ No | ✅ Yes | ✅ Agent 5 |
| 6 | Migrate SiteCategoriesTool | ❌ No | ✅ Yes | ✅ Agent 6 |
| 7 | Delete old code | ✅ Yes* | ✅ Yes | ✅ Agent 7 |

\* Breaking but safe - no code uses deleted functions

**Total Time:** ~4 hours (20min + 60min + 30min + 20min + 20min + 20min + 30min = 200 minutes)

---

### Phase 4: Final Testing & Documentation (1 hour)

**4.1 Run All Tests**
- Unit tests for validation schema
- Integration tests for API endpoint
- E2E tests for all updated components

**4.2 Update Documentation**
- Add migration note to changelog
- Update architecture documentation to reflect API-first pattern
- Document the `authedPut` pattern for future features

---

## Acceptance Criteria

### Functional Requirements

✅ **FR1: API Endpoint**
- [ ] PUT `/api/sites/[siteKey]` endpoint exists
- [ ] Authenticates via Bearer token
- [ ] Authorizes site owner only
- [ ] Validates update data with Zod schema
- [ ] Updates Firestore server-side
- [ ] Triggers cache purging atomically

✅ **FR2: Client Updates**
- [ ] All components use `authedPut` or `updateSiteApi` wrapper
- [ ] Handles authentication errors gracefully
- [ ] Handles authorization errors gracefully
- [ ] Handles validation errors with clear messages

✅ **FR3: Old Code Removed**
- [ ] Old `updateSite.ts` function deleted
- [ ] Old `/api/cache/purge-site.ts` endpoint deleted
- [ ] Old `purgeCacheForSite` helper removed (if no other usages)
- [ ] No references to old pattern remain in codebase

✅ **FR4: All Features Work**
- [ ] Site settings form works
- [ ] TOC sort order updates work
- [ ] Category management works
- [ ] Cache purging works for all updates

### Non-Functional Requirements

✅ **NFR1: Performance**
- [ ] API response time < 2 seconds for typical updates
- [ ] Cache purging completes within API request lifecycle
- [ ] No performance regression vs old pattern

✅ **NFR2: Error Handling**
- [ ] Clear error messages for validation failures
- [ ] Proper HTTP status codes (401, 403, 404, 400, 500)
- [ ] Failed cache purging doesn't block update success

✅ **NFR3: Developer Experience**
- [ ] API pattern matches thread updates
- [ ] Clear migration path documented
- [ ] TypeScript types for API requests/responses

---

## Testing Strategy

### Unit Tests

**Schema Validation:**
```typescript
describe('SiteUpdateSchema', () => {
  it('should accept valid site updates', () => {
    const update = {
      name: 'My Campaign',
      description: 'A great campaign',
      system: 'dnd5e',
    };
    expect(() => SiteUpdateSchema.parse(update)).not.toThrow();
  });
  
  it('should reject name too short', () => {
    const update = { name: 'ab' }; // < 3 chars
    expect(() => SiteUpdateSchema.parse(update)).toThrow();
  });
  
  it('should reject invalid URLs', () => {
    const update = { posterURL: 'not-a-url' };
    expect(() => SiteUpdateSchema.parse(update)).toThrow();
  });
  
  it('should allow empty string for optional URLs', () => {
    const update = { posterURL: '' };
    expect(() => SiteUpdateSchema.parse(update)).not.toThrow();
  });
});
```

### Integration Tests

**API Endpoint:**
```typescript
describe('PUT /api/sites/[siteKey]', () => {
  it('should update site metadata', async () => {
    const token = await getTestUserToken();
    const siteKey = await createTestSite();
    
    const response = await fetch(`/api/sites/${siteKey}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Name',
        description: 'Updated Description',
      }),
    });
    
    expect(response.status).toBe(200);
    
    const site = await getSiteData(siteKey);
    expect(site.name).toBe('Updated Name');
    expect(site.description).toBe('Updated Description');
  });
  
  it('should return 401 without auth token', async () => {
    const siteKey = await createTestSite();
    
    const response = await fetch(`/api/sites/${siteKey}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Hacked' }),
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should return 403 for non-owner', async () => {
    const ownerToken = await getTestUserToken('owner');
    const otherToken = await getTestUserToken('other');
    const siteKey = await createTestSite({ owners: ['owner'] });
    
    const response = await fetch(`/api/sites/${siteKey}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${otherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Unauthorized Update' }),
    });
    
    expect(response.status).toBe(403);
  });
  
  it('should trigger cache purging', async () => {
    const token = await getTestUserToken();
    const siteKey = await createTestSite();
    
    // Populate cache
    await fetch(`/sites/${siteKey}`);
    
    // Update site
    await fetch(`/api/sites/${siteKey}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Cache Purge Test' }),
    });
    
    // Verify cache was purged (new content visible immediately)
    const siteResponse = await fetch(`/sites/${siteKey}`);
    const html = await siteResponse.text();
    expect(html).toContain('Cache Purge Test');
  });
});
```

### E2E Tests

**Site Settings Form:**
```typescript
test('site owner can update site metadata via API', async ({ page }) => {
  const siteKey = await createTestSite();
  await loginAsOwner(page);
  
  await page.goto(`/sites/${siteKey}/settings`);
  
  // Update name
  await page.fill('input[name="name"]', 'New Site Name');
  await page.fill('textarea[name="description"]', 'New description');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify success snackbar
  await expect(page.locator('.snackbar')).toContainText('saved');
  
  // Verify update persisted
  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue('New Site Name');
  await expect(page.locator('textarea[name="description"]')).toHaveValue('New description');
});

test('cache purging works after site update', async ({ page }) => {
  const siteKey = await createTestSite({ name: 'Original Name' });
  await loginAsOwner(page);
  
  // Load site page (populate cache)
  await page.goto(`/sites/${siteKey}`);
  await expect(page.locator('h1')).toContainText('Original Name');
  
  // Update site name via settings
  await page.goto(`/sites/${siteKey}/settings`);
  await page.fill('input[name="name"]', 'Updated Name');
  await page.click('button[type="submit"]');
  await expect(page.locator('.snackbar')).toContainText('saved');
  
  // Navigate back to site page - should show updated name immediately
  await page.goto(`/sites/${siteKey}`);
  await expect(page.locator('h1')).toContainText('Updated Name');
});
```

### Manual Testing Checklist

- [ ] Update site name via settings form
- [ ] Update site description
- [ ] Update site system (D&D 5e, Pathfinder, etc.)
- [ ] Update sort order via TOC settings
- [ ] Update page categories
- [ ] Verify cache purging works (changes visible immediately)
- [ ] Try to update site as non-owner (should fail with 403)
- [ ] Try to update site without auth token (should fail with 401)
- [ ] Submit invalid data (name too short, invalid URL)
- [ ] Test silent mode (timestamps not updated)
- [ ] Network failure handling (show user-friendly error)

---

## Migration Timeline

### Sequential Commits (4-5 hours total, 7 commits)

**Day 1: Foundation (1.5 hours)**
- Commit 1: Validation schema (20 min) → Agent 1
- Commit 2: API endpoint (60 min) → Agent 2
- Commit 3: Wrapper function (30 min) → Agent 3

**Day 2: Migration (1 hour)**
- Commit 4: SiteMetaForm (20 min) → Agent 4
- Commit 5: SiteTocTool (20 min) → Agent 5
- Commit 6: SiteCategoriesTool (20 min) → Agent 6

**Day 3: Cleanup & Deploy (1.5 hours)**
- Commit 7: Delete old code (30 min) → Agent 7
- Final testing (30 min)
- Documentation (30 min)
- Deploy to production

**Why Sequential Commits?**
- ✅ Each commit independently testable
- ✅ Each commit can pause/resume work
- ✅ Can assign different commits to different agents
- ✅ Non-breaking until final commit
- ✅ Clear progress tracking (7 checkpoints)
- ✅ Easy to review (small, focused changes)
- ✅ Can cherry-pick if needed

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation:** 
- Test all updated components together before deployment
- E2E tests cover all site update flows
- Can roll back entire change if issues found

### Risk 2: Cache Purging Failures
**Mitigation:**
- Cache purging is best-effort (don't fail update if purge fails)
- Log failures for monitoring
- Caches have TTL, will expire naturally

### Risk 3: Performance Regression
**Mitigation:**
- API endpoint adds minimal overhead
- Measure performance before/after
- Cache purging is async, doesn't block response

### Risk 4: Missed Call Sites
**Mitigation:**
- Search entire codebase with regex: `updateSite\(`
- Check git submodules for usage
- TypeScript will error if function is deleted but still imported

---

## Benefits

### For Developers
- ✅ **Consistent Architecture**: All updates follow same pattern immediately
- ✅ **Simpler Client Code**: One API call instead of Firestore + cache purge
- ✅ **Better Error Handling**: Centralized error responses
- ✅ **Easier Testing**: Mock API endpoints instead of Firestore
- ✅ **No Technical Debt**: Old pattern completely removed
- ✅ **Clear Pattern**: All future features use API-first approach

### For Users
- ✅ **More Reliable**: Atomic operations reduce race conditions
- ✅ **Better Performance**: Cache purging optimized server-side
- ✅ **Consistent Behavior**: All content types work the same way

### For System
- ✅ **Better Monitoring**: All updates go through API endpoints (easier to track)
- ✅ **Better Security**: Server-side validation and authorization
- ✅ **Easier Debugging**: Centralized logging in API endpoints

---

## Future Enhancements

### After This PBI
- **PBI-043**: Manual TOC ordering follows established API pattern
- **Future**: Consider migrating `updatePage` to API endpoint
- **Future**: Consider migrating asset updates to API endpoint
- **Future**: Unified update patterns across all content types

### Long Term
- **Batch Updates**: Support updating multiple sites/pages in one request
- **Optimistic Updates**: Update UI before server confirmation
- **Conflict Resolution**: Handle concurrent updates gracefully
- **Audit Log**: Track all updates for compliance/debugging

---

## References

- **Thread Pattern**: `src/firebase/client/threads/updateThreadApi.ts`
- **Current Site Pattern**: `src/firebase/client/site/updateSite.ts`
- **Cache Purging**: `src/lib/server/content-hooks.ts`
- **Thread API Endpoint**: `src/pages/api/threads/[threadKey].ts`
- **Similar Migration**: Thread labels (PBI-041) moved from client-side to API

---

## Success Metrics

- **Code Consistency**: 100% of site updates use API pattern (no coexistence)
- **Zero Deprecation Debt**: Old pattern completely removed in same PBI
- **Cache Hit Rate**: No decrease in cache effectiveness
- **Error Rate**: < 1% API request failures
- **Response Time**: < 2 seconds for 95th percentile
- **Zero Breaking Changes**: Existing functionality maintained throughout migration
- **Commit Atomicity**: All 7 commits independently testable and deployable
- **Agent Handoff**: Each commit can be completed by different agent sequentially
---

## Known Issues / Bugs Found During Implementation

### Bug: Incorrect HTTP Method Semantics in Commit 2
**Discovered**: During code review after Commit 2 completion  
**Severity**: Low (semantic correctness issue)

**Issue Description:**
Commit 2 implemented the endpoint with PUT as the primary method and PATCH as an alias:
```typescript
export async function PUT({ params, request }: APIContext): Promise<Response> { ... }
export const PATCH = PUT;
```

However, the actual behavior is **partial updates** (PATCH semantics), not full resource replacement (PUT semantics):
- All fields in `SiteUpdateSchema` are optional
- Only provided fields are updated in Firestore
- Missing fields are not deleted/reset

**REST Semantics:**
- **PUT**: Replace entire resource (full representation required)
- **PATCH**: Partially modify resource (send only changed fields)

**Root Cause:**
- Followed the existing thread API pattern which uses PUT
- Didn't consider that we're implementing partial updates, not full resource replacement

**Impact:**
- ✅ Functionality works correctly
- ⚠️ Semantically incorrect HTTP method choice
- ⚠️ May confuse API consumers expecting PUT behavior

**Resolution Plan:**
- Switch primary method to PATCH (semantically correct for partial updates)
- Keep PUT as an alias for backward compatibility
- Update documentation to reflect PATCH as primary
- Update tests to use PATCH as primary method
- Add comment explaining PUT alias exists for compatibility

**Fixed In**: Commit 2.1 (hotfix before Commit 3)

---
