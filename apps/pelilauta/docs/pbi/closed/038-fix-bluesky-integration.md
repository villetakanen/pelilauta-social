# PBI-026: Fix Bluesky Integration Issues

**Status:** Ready for Development  
**Priority:** High  
**Estimated Effort:** 3-5 hours  
**Labels:** `bug`, `integration`, `bluesky`, `social-media`

## User Story

As a thread author who wants to syndicate content to Bluesky, I need the integration to work reliably and store the post URL, so that I can track cross-platform engagement and know if my content was successfully shared.

## Problem Statement

The Bluesky integration has multiple critical issues preventing it from working correctly:

### 1. **Critical Logic Error** (Line 95 in `bskyService.ts`)
```typescript
if (!postRecord === undefined || !postRecord.text) {
```
This condition will **never be true** because:
- `!postRecord` evaluates to `false` (postRecord is an object)
- `false === undefined` is always `false`
- This means the validation is completely bypassed

**Impact:** Posts may be attempted with invalid data, causing silent failures.

### 2. **Lost Bluesky URI**
The entire syndication flow fails to capture and store the Bluesky post URL:

```typescript
// bskyService.ts - Returns URI
return response.uri; // ✅ Generated

// /api/bsky/skeet.ts - Doesn't capture or return it
await postToBluesky(...); // ❌ Return value ignored

// syndicateToBsky() - Doesn't receive or store it
await authedPost('/api/bsky/skeet', {...}); // ❌ No return value used
```

**Impact:** Users cannot see their Bluesky posts, track engagement, or verify syndication succeeded.

### 3. **Security Issue**
Line 24 in `bskyService.ts` logs credentials:
```typescript
logDebug(identifier, password); // ⚠️ Logs secrets to console/logs
```

**Impact:** Credentials may be exposed in logs, build outputs, or error tracking services.

### 4. **Missing Schema Fields**
`ThreadSchema` has no fields for storing Bluesky post information.

**Impact:** Even if we fix the code, there's nowhere to persist the data.

### 5. **No Error Handling or User Feedback**
- `syndicateToBsky()` doesn't check if posting succeeded
- Users don't know if syndication failed
- Silent failures provide no debugging information

## Technical Details

### Current Flow
1. User creates thread → `submitThreadUpdate.ts` calls `syndicateToBsky()`
2. `syndicateToBsky()` calls `/api/bsky/skeet` endpoint
3. API endpoint calls `postToBluesky()` which returns a URI
4. **URI is discarded and never reaches the client or database**

### Required Changes

#### A. Fix Logic Error in `bskyService.ts`
**File:** `src/utils/server/bsky/bskyService.ts` (Line 95)

```typescript
// ❌ BEFORE (broken)
if (!postRecord === undefined || !postRecord.text) {
  logError('Post record is undefined or empty. Cannot post to Bluesky.');
  return null;
}

// ✅ AFTER (fixed)
if (!postRecord || !postRecord.text) {
  logError('Post record is undefined or empty. Cannot post to Bluesky.');
  return null;
}
```

#### B. Remove Credential Logging
**File:** `src/utils/server/bsky/bskyService.ts` (Line 24)

```typescript
// ❌ REMOVE this line
logDebug(identifier, password);

// ✅ Replace with safe logging
logDebug('Bluesky login attempt for handle:', identifier); // Don't log password
```

#### C. Add Schema Fields for Bluesky Data
**File:** `src/schemas/ThreadSchema.ts`

```typescript
export const ThreadSchema = ContentEntrySchema.extend({
  title: z.string(),
  channel: z.string(),
  // ... existing fields ...
  
  // NEW: Bluesky syndication tracking
  blueskyPostUrl: z.string().url().optional(), // https://bsky.app/profile/[handle]/post/[rkey]
  blueskyPostUri: z.string().optional(), // at://did:plc:xxx/app.bsky.feed.post/yyy
  blueskyPostCreatedAt: z.date().optional(), // When post was created
  
  // ... rest of schema ...
});
```

**Rationale for two fields:**
- `blueskyPostUrl`: Human-readable web URL for display and embeds
- `blueskyPostUri`: AT Protocol URI for programmatic API operations
- `blueskyPostCreatedAt`: Track when syndication occurred

#### D. Update API to Return Bluesky URI
**File:** `src/pages/api/bsky/skeet.ts`

```typescript
export const POST: APIRoute = async ({ request }) => {
  // ... existing auth code ...

  const articleData = await request.json();
  
  // ✅ CHANGE: Capture the returned URI
  const blueskyUri = await postToBluesky(
    articleData.text,
    articleData.linkUrl,
    articleData.linkTitle,
    articleData.linkDescription,
  );

  if (!blueskyUri) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to post to Bluesky'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ✅ NEW: Return the URI to client
  return new Response(
    JSON.stringify({
      success: true,
      blueskyUri,
      message: 'Successfully posted to Bluesky'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

#### E. Convert AT Protocol URI to Web URL
**New Utility Function:** Create `src/utils/bskyHelpers.ts`

```typescript
/**
 * Converts AT Protocol URI to web URL
 * @param uri - AT Protocol URI (e.g., at://did:plc:xxx/app.bsky.feed.post/yyy)
 * @param handle - User's Bluesky handle (e.g., pelilauta.social)
 * @returns Web URL (e.g., https://bsky.app/profile/pelilauta.social/post/yyy)
 */
export function atUriToWebUrl(uri: string, handle: string): string | null {
  try {
    // URI format: at://did:plc:xxx/app.bsky.feed.post/rkey
    const match = uri.match(/at:\/\/[^/]+\/app\.bsky\.feed\.post\/(.+)$/);
    if (!match) return null;
    
    const rkey = match[1];
    return `https://bsky.app/profile/${handle}/post/${rkey}`;
  } catch (error) {
    logError('atUriToWebUrl', 'Failed to convert URI:', error);
    return null;
  }
}
```

#### F. Update Client to Capture and Store URI
**File:** `src/components/svelte/thread-editor/submitThreadUpdate.ts`

```typescript
export async function syndicateToBsky(
  thread: Thread,
  uid: string,
): Promise<{ success: boolean; blueskyPostUrl?: string; error?: string }> {
  const profile = await getProfile(uid);

  // ... existing channel fetching code ...

  if (!thread.markdownContent) {
    return { success: false, error: 'No content to syndicate' };
  }

  const text = `${profile?.nick || 'Pelilauta'} loi uuden ketjun aiheessa: ${channelTitle}\n\n #roolipelit #pelilauta #roolipelsky`;
  const linkUrl = `https://pelilauta.social/threads/${thread.key}`;
  const linkTitle = thread.title;
  const linkDescription = `${thread.markdownContent.substring(0, 220)}...`;

  try {
    // ✅ CHANGE: Capture response
    const response = await authedPost(`${window.location.origin}/api/bsky/skeet`, {
      text,
      linkUrl,
      linkTitle,
      linkDescription,
    });

    if (!response.success || !response.blueskyUri) {
      logError('syndicateToBsky', 'Failed to post to Bluesky:', response.error);
      return { success: false, error: response.error || 'Unknown error' };
    }

    // ✅ NEW: Convert URI to web URL
    const { atUriToWebUrl } = await import('src/utils/bskyHelpers');
    const blueskyPostUrl = atUriToWebUrl(response.blueskyUri, profile?.username || 'pelilauta.social');

    if (!blueskyPostUrl) {
      logError('syndicateToBsky', 'Failed to convert Bluesky URI to URL');
      return { success: false, error: 'Failed to generate post URL' };
    }

    // ✅ NEW: Update thread with Bluesky data
    const { db } = await import('../../../firebase/client');
    const { doc, updateDoc } = await import('firebase/firestore');
    const { THREADS_COLLECTION_NAME } = await import('src/schemas/ThreadSchema');

    await updateDoc(doc(db, THREADS_COLLECTION_NAME, thread.key), {
      blueskyPostUrl,
      blueskyPostUri: response.blueskyUri,
      blueskyPostCreatedAt: new Date(),
    });

    return { success: true, blueskyPostUrl };
  } catch (error) {
    logError('syndicateToBsky', 'Exception during Bluesky syndication:', error);
    return { success: false, error: 'Network or server error' };
  }
}
```

#### G. Update submitThreadUpdate to Handle Errors
**File:** `src/components/svelte/thread-editor/submitThreadUpdate.ts`

```typescript
export async function submitThreadUpdate(
  data: Partial<Thread>,
  files?: File[],
) {
  // ... existing thread creation code ...

  const postedThread: Thread = {
    ...data,
    key: threadKey,
  } as Thread;

  // ✅ CHANGE: Handle syndication result
  const syndicationResult = await syndicateToBsky(postedThread, data.owners[0]);
  
  if (!syndicationResult.success) {
    // ⚠️ Don't fail the entire operation, just log the error
    logWarn('submitThreadUpdate', 'Bluesky syndication failed:', syndicationResult.error);
    // TODO: Show user notification that syndication failed
  } else {
    logDebug('submitThreadUpdate', 'Bluesky syndication succeeded:', syndicationResult.blueskyPostUrl);
    // TODO: Show user notification with link to Bluesky post
  }

  return threadKey;
}
```

#### H. Display Bluesky Embed in Thread Info Section

**File:** `src/components/server/ThreadsApp/ThreadInfoSection.astro`

Add the Bluesky embed card after the thread info card:

```astro
<!-- Bluesky Embed -->
{
  thread.blueskyPostUrl && (
    <cn-card
      title={t("threads:info.blueskyTitle")}
      noun="share"
      class="mt-2"
    >
      <blockquote
        class="bluesky-embed"
        data-bluesky-uri={thread.blueskyPostUri || thread.blueskyPostUrl}
      >
        <p>
          <a
            href={thread.blueskyPostUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("threads:info.viewOnBluesky")}
          </a>
        </p>
      </blockquote>
    </cn-card>
  )
}
```

Add the Bluesky embed script and styles at the bottom of the component:

```astro
<!-- Bluesky embed script -->
<script is:inline src="https://embed.bsky.app/static/embed.js" async></script>

<style>
  /* Ensure the embed fits within the card */
  .bluesky-embed {
    margin: 0;
    max-width: 100%;
  }
</style>
```

#### I. Add i18n Translations

**File:** `src/locales/fi/threads.ts`

```typescript
info: {
  // ... existing fields ...
  blueskyTitle: "Bluesky",
  viewOnBluesky: "Katso Blueskyssa",
  // ...
},
```

**File:** `src/locales/en/threads.ts`

```typescript
info: {
  // ... existing fields ...
  blueskyTitle: "Bluesky",
  viewOnBluesky: "View on Bluesky",
  // ...
},
```

## Acceptance Criteria

- [ ] Logic error on line 95 of `bskyService.ts` is fixed
- [ ] Credential logging is removed from `bskyService.ts`
- [ ] `ThreadSchema` includes `blueskyPostUrl`, `blueskyPostUri`, and `blueskyPostCreatedAt` fields
- [ ] `/api/bsky/skeet` endpoint returns Bluesky URI in response
- [ ] `atUriToWebUrl()` helper function correctly converts AT URIs to web URLs
- [ ] `syndicateToBsky()` captures and stores Bluesky post data in Firestore
- [ ] Function returns success/error status with appropriate messages
- [ ] Bluesky embed displays in thread info section when `blueskyPostUrl` exists
- [ ] Bluesky embed uses official embed script and renders correctly
- [ ] Fallback link works when JavaScript is disabled
- [ ] i18n translations added for Bluesky UI elements (Finnish and English)
- [ ] Existing threads without Bluesky data continue to work (backward compatibility)
- [ ] Manual testing confirms posts appear on Bluesky and URLs are stored correctly

## Testing Plan

1. **Unit Tests**
   - Test `atUriToWebUrl()` with various URI formats
   - Test schema validation with new optional fields

2. **Integration Tests**
   - Create test thread and verify Bluesky post is created
   - Verify thread document contains correct `blueskyPostUrl` and `blueskyPostUri`
   - Test error handling when Bluesky API is unavailable

3. **Manual Testing**
   - Create thread → Check Bluesky for post
   - Verify thread shows Bluesky URL in database
   - Test with missing environment variables
   - Test network failure scenarios

## Future Enhancements (Out of Scope)

- [ ] Display Bluesky embed in thread info section (see PBI-025)
- [ ] Show Bluesky engagement metrics (likes, reposts, replies)
- [ ] Retry mechanism for failed syndications
- [ ] User notification/toast when syndication succeeds/fails
- [ ] Admin dashboard showing syndication success rates

## Dependencies

- `@atproto/api` package (already installed: ^0.15.14)
- Environment variables: `SECRET_bsky_handle`, `SECRET_bsky_password`
- Feature flag: `SECRET_FEATURE_bsky` should be `true`

## Notes

- **Backward Compatibility:** New schema fields are optional, so existing threads won't break
- **Error Handling Philosophy:** Syndication failures should NOT prevent thread creation
- **Security:** Never log credentials; only log handle for debugging
- **Performance:** Syndication happens asynchronously; don't block thread creation on Bluesky response