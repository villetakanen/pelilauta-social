# PBI: Convert Library Page CSR Redirect to SSR Authentication

**Title:** Convert Library Page Client-Side Authentication Redirect to Server-Side Redirect

**As a** user, **I want** the library page authentication check to happen server-side during page load, **so that** I don't see the page flash before being redirected to the public sites list when unauthenticated.

---

### Description

Currently, the library page (`src/pages/library/index.astro`) performs authentication checking on the client-side through the `UserSitesList.svelte` component. This creates a poor user experience where:

1. The library page loads and renders fully
2. JavaScript executes and checks authentication state
3. Unauthenticated users see a brief flash of the library page
4. Client-side redirect to `/sites` happens after the page has already loaded

With our current server-side authentication infrastructure using session cookies and the `verifySession` utility, we can perform this redirect server-side during the initial page request, eliminating the flash and improving the user experience.

#### Current Client-Side Flow:

**File:** `src/components/svelte/site-library/UserSitesList.svelte`
```javascript
onMount(() => {
  if (!$uid) {
    // Redirect to public site list if not logged in
    window.location.href = '/sites';
  }
});
```

#### Proposed Server-Side Solution:

Move the authentication check to the Astro page frontmatter, following the same pattern used in other authenticated pages like `settings.astro`:

**File:** `src/pages/library/index.astro`
```javascript
---
import { verifySession } from '@utils/server/auth/verifySession';

const session = await verifySession(Astro);

if (!session?.uid) {
  // Redirect unauthenticated users to public sites list
  return Astro.redirect('/sites');
}

// Set cache control headers for authenticated content
Astro.response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

// ... rest of page logic
---
```

### Benefits

- **Better Performance:** No client-side JavaScript execution needed for authentication check
- **Improved User Experience:** No flash of content before redirect
- **SEO Friendly:** Search engines receive proper HTTP redirect responses
- **Consistent Architecture:** Aligns with other authenticated pages in the application
- **CDN Friendly:** Authentication happens at the edge, not client-side

### Implementation Details

#### Files to Modify:

1. **`src/pages/library/index.astro`**
   - Add server-side authentication check in frontmatter
   - Import and use `verifySession` utility
   - Add redirect logic for unauthenticated users
   - Set appropriate caching headers to prevent caching of authenticated content

2. **`src/components/svelte/site-library/UserSitesList.svelte`**
   - Remove client-side authentication check in `onMount`
   - Remove `window.location.href = '/sites'` redirect
   - Simplify component to only handle authenticated users

#### Security Considerations:

- Uses existing secure server-side authentication infrastructure
- Leverages session cookies which are already implemented
- No client-side authentication tokens exposed
- Maintains consistent security patterns across the application

#### Caching Considerations:

- Sets `Cache-Control: private, no-cache, no-store, must-revalidate` headers
- Prevents CDN and browser caching of user-specific content
- Ensures each request goes through authentication check
- Maintains CDN performance for public routes while securing private content

### Acceptance Criteria

- [ ] Unauthenticated users accessing `/library` receive an immediate HTTP redirect to `/sites`
- [ ] No client-side JavaScript authentication check occurs in `UserSitesList.svelte`
- [ ] No flash of library page content occurs for unauthenticated users
- [ ] Authenticated users can access the library page normally
- [ ] The redirect behavior is identical to the previous client-side implementation
- [ ] Page load performance is improved for unauthenticated users
- [ ] Server-side authentication follows the same pattern as other authenticated pages
- [ ] Appropriate cache control headers are set to prevent caching of user-specific content
- [ ] CDN does not cache the authenticated library page responses

### Testing Requirements

- [ ] Manual testing: Visit `/library` while unauthenticated → should redirect to `/sites`
- [ ] Manual testing: Visit `/library` while authenticated → should show library page
- [ ] E2E test: Verify unauthenticated redirect behavior
- [ ] E2E test: Verify authenticated access still works
- [ ] Performance test: Verify no client-side authentication delay
- [ ] Browser test: Confirm no content flash occurs during redirect

### Priority

**Low Priority** - This is a minor UX improvement patch. The functionality currently works, but the server-side redirect provides a better user experience and aligns with the application's architecture patterns.

### Estimated Effort

**Small** - Minimal changes required:
- Add 6-7 lines to the Astro page frontmatter (auth check + cache headers)
- Remove 4-5 lines from the Svelte component
- Simple manual testing to verify behavior and caching

### Migration Strategy

1. **Phase 1:** Add server-side authentication check to `library/index.astro`
2. **Phase 2:** Remove client-side authentication check from `UserSitesList.svelte`
3. **Phase 3:** Test both authenticated and unauthenticated scenarios
4. **Phase 4:** Deploy and monitor

This change maintains backward compatibility and improves the user experience without any functional changes to the application behavior.
