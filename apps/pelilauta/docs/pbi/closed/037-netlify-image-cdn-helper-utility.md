# PBI-037: Netlify Image CDN Helper Utility

**Status:** Ready for Development  
**Priority:** High  
**Effort:** Small (1-2 days)  
**Type:** Enhancement  
**Created:** 2025-10-24

---

## Executive Summary

Create a reusable helper utility to leverage Netlify's built-in Image CDN for optimizing Firebase Storage images at delivery time. This provides automatic WebP/AVIF conversion, dynamic resizing, and CDN edge caching without changing existing upload flows.

**Key Benefits:**
- 60-80% file size reduction through modern formats (AVIF/WebP)
- Responsive image delivery (right size for viewport)
- Zero changes to upload logic (non-breaking)
- Reduced Firebase bandwidth costs
- Faster page loads via CDN edge delivery

---

## Problem Statement

Currently, all images from Firebase Storage are served directly with their original URLs:

```svelte
<!-- Current approach -->
<img src="https://storage.googleapis.com/bucket/Threads/abc/image.jpg" />
```

**Issues:**
- No automatic format optimization (stuck with uploaded format)
- No responsive sizing (same file for all viewports)
- Direct Firebase bandwidth usage (no CDN benefits)
- Manual WebP conversion only happens at upload (client-side only)
- Server-side uploads (threads/replies) serve unoptimized images

**Impact:**
- Slower page loads (larger files)
- Higher Firebase Storage bandwidth costs (~$0.10/GB)
- Poor mobile experience (desktop-sized images)

---

## Proposed Solution

Create `netlifyImage()` utility that transforms Firebase Storage URLs into Netlify Image CDN URLs with optimization parameters:

```typescript
// src/utils/images/netlifyImage.ts

interface NetlifyImageOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export function netlifyImage(
  firebaseUrl: string,
  options: NetlifyImageOptions = {}
): string {
  const params = new URLSearchParams();
  params.set('url', firebaseUrl);
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.format) params.set('fm', options.format);
  if (options.quality) params.set('q', options.quality.toString());
  if (options.fit) params.set('fit', options.fit);
  if (options.position) params.set('position', options.position);
  
  return `/.netlify/images?${params.toString()}`;
}
```

**Usage Example:**

```svelte
<script lang="ts">
import { netlifyImage } from '@utils/images/netlifyImage';

const imageUrl = 'https://storage.googleapis.com/...';

// Generate responsive srcset
const thumbnail = netlifyImage(imageUrl, { width: 400, format: 'webp' });
const medium = netlifyImage(imageUrl, { width: 800, format: 'webp' });
const large = netlifyImage(imageUrl, { width: 1600, format: 'webp' });
</script>

<img
  src={medium}
  srcset="{thumbnail} 400w, {medium} 800w, {large} 1600w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt="Thread image"
  loading="lazy"
/>
```

---

## Implementation Details

### File Structure

```
src/utils/images/
  netlifyImage.ts          # Main utility (NEW)
  netlifyImage.test.ts     # Unit tests (NEW)
```

### Core Function

**Input:**
- `firebaseUrl`: Full Firebase Storage URL
- `options`: Optional transformation parameters

**Output:**
- Netlify Image CDN URL with query parameters

**Validation:**
- Ensure URL is from Firebase Storage domain
- Validate numeric parameters (width, height, quality)
- Provide sensible defaults

### Complete Implementation

```typescript
// src/utils/images/netlifyImage.ts

import { logWarn } from '@utils/logHelpers';

export interface NetlifyImageOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Transform Firebase Storage URL to Netlify Image CDN URL with optimization
 * 
 * @param firebaseUrl - Full Firebase Storage URL
 * @param options - Image transformation options
 * @returns Netlify Image CDN URL with query parameters
 * 
 * @example
 * ```ts
 * const optimized = netlifyImage(url, { width: 800, format: 'webp' });
 * // Returns: /.netlify/images?url=...&w=800&fm=webp
 * ```
 */
export function netlifyImage(
  firebaseUrl: string,
  options: NetlifyImageOptions = {}
): string {
  // Validate input
  if (!firebaseUrl || typeof firebaseUrl !== 'string') {
    logWarn('netlifyImage', 'Invalid URL provided:', firebaseUrl);
    return firebaseUrl;
  }

  // Ensure URL is from Firebase Storage
  if (!firebaseUrl.includes('storage.googleapis.com') && 
      !firebaseUrl.includes('firebasestorage.googleapis.com')) {
    logWarn('netlifyImage', 'URL is not from Firebase Storage:', firebaseUrl);
    return firebaseUrl;
  }

  // Build query parameters
  const params = new URLSearchParams();
  params.set('url', firebaseUrl);
  
  // Add transformation parameters
  if (options.width && options.width > 0) {
    params.set('w', Math.round(options.width).toString());
  }
  
  if (options.height && options.height > 0) {
    params.set('h', Math.round(options.height).toString());
  }
  
  if (options.format) {
    params.set('fm', options.format);
  }
  
  if (options.quality && options.quality > 0 && options.quality <= 100) {
    params.set('q', Math.round(options.quality).toString());
  }
  
  if (options.fit) {
    params.set('fit', options.fit);
  }
  
  if (options.position) {
    params.set('position', options.position);
  }

  return `/.netlify/images?${params.toString()}`;
}

/**
 * Generate responsive srcset string for multiple image sizes
 * 
 * @param firebaseUrl - Full Firebase Storage URL
 * @param widths - Array of widths to generate
 * @param options - Shared image transformation options (format, quality, etc.)
 * @returns srcset string ready for img element
 * 
 * @example
 * ```ts
 * const srcset = generateSrcset(url, [400, 800, 1600], { format: 'webp' });
 * // Returns: "/.netlify/images?url=...&w=400&fm=webp 400w, ..."
 * ```
 */
export function generateSrcset(
  firebaseUrl: string,
  widths: number[] = [400, 800, 1600],
  options: Omit<NetlifyImageOptions, 'width'> = {}
): string {
  return widths
    .map(width => {
      const url = netlifyImage(firebaseUrl, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}
```

### Unit Tests

```typescript
// src/utils/images/netlifyImage.test.ts

import { describe, it, expect } from 'vitest';
import { netlifyImage, generateSrcset } from './netlifyImage';

describe('netlifyImage', () => {
  const firebaseUrl = 'https://storage.googleapis.com/bucket/path/image.jpg';

  it('should generate basic Netlify image URL', () => {
    const result = netlifyImage(firebaseUrl);
    
    expect(result).toContain('/.netlify/images');
    expect(result).toContain('url=');
    expect(result).toContain(encodeURIComponent(firebaseUrl));
  });

  it('should add width parameter', () => {
    const result = netlifyImage(firebaseUrl, { width: 800 });
    
    expect(result).toContain('w=800');
  });

  it('should add height parameter', () => {
    const result = netlifyImage(firebaseUrl, { height: 600 });
    
    expect(result).toContain('h=600');
  });

  it('should add format parameter', () => {
    const result = netlifyImage(firebaseUrl, { format: 'webp' });
    
    expect(result).toContain('fm=webp');
  });

  it('should add quality parameter', () => {
    const result = netlifyImage(firebaseUrl, { quality: 85 });
    
    expect(result).toContain('q=85');
  });

  it('should add fit parameter', () => {
    const result = netlifyImage(firebaseUrl, { fit: 'cover' });
    
    expect(result).toContain('fit=cover');
  });

  it('should add position parameter', () => {
    const result = netlifyImage(firebaseUrl, { position: 'center' });
    
    expect(result).toContain('position=center');
  });

  it('should combine multiple parameters', () => {
    const result = netlifyImage(firebaseUrl, {
      width: 800,
      height: 600,
      format: 'webp',
      quality: 85,
      fit: 'cover',
    });
    
    expect(result).toContain('w=800');
    expect(result).toContain('h=600');
    expect(result).toContain('fm=webp');
    expect(result).toContain('q=85');
    expect(result).toContain('fit=cover');
  });

  it('should handle invalid width by rounding', () => {
    const result = netlifyImage(firebaseUrl, { width: 799.7 });
    
    expect(result).toContain('w=800');
  });

  it('should ignore negative width', () => {
    const result = netlifyImage(firebaseUrl, { width: -100 });
    
    expect(result).not.toContain('w=');
  });

  it('should ignore quality above 100', () => {
    const result = netlifyImage(firebaseUrl, { quality: 150 });
    
    expect(result).not.toContain('q=');
  });

  it('should return original URL for non-Firebase URLs', () => {
    const externalUrl = 'https://example.com/image.jpg';
    const result = netlifyImage(externalUrl);
    
    expect(result).toBe(externalUrl);
  });

  it('should return original URL for invalid input', () => {
    const result = netlifyImage('');
    
    expect(result).toBe('');
  });
});

describe('generateSrcset', () => {
  const firebaseUrl = 'https://storage.googleapis.com/bucket/path/image.jpg';

  it('should generate srcset for default widths', () => {
    const result = generateSrcset(firebaseUrl);
    
    expect(result).toContain('400w');
    expect(result).toContain('800w');
    expect(result).toContain('1600w');
  });

  it('should generate srcset for custom widths', () => {
    const result = generateSrcset(firebaseUrl, [200, 400]);
    
    expect(result).toContain('200w');
    expect(result).toContain('400w');
    expect(result).not.toContain('800w');
  });

  it('should apply format to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { format: 'webp' });
    
    expect(result).toContain('fm=webp');
    expect(result.match(/fm=webp/g)?.length).toBe(2);
  });

  it('should apply quality to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { quality: 85 });
    
    expect(result).toContain('q=85');
    expect(result.match(/q=85/g)?.length).toBe(2);
  });
});
```

---

## Integration Points

### 1. Thread Image Display

**Component:** Thread detail pages, thread cards

**Before:**
```svelte
<img src={image.url} alt={image.alt} />
```

**After:**
```svelte
<script lang="ts">
import { netlifyImage, generateSrcset } from '@utils/images/netlifyImage';
</script>

<img
  src={netlifyImage(image.url, { width: 800, format: 'webp', quality: 85 })}
  srcset={generateSrcset(image.url, [400, 800, 1600], { format: 'webp', quality: 85 })}
  sizes="(max-width: 768px) 100vw, 800px"
  alt={image.alt}
  loading="lazy"
/>
```

### 2. Site Asset Display

**Component:** Site asset galleries, page content images

**Before:**
```svelte
<img src={asset.url} alt={asset.description} />
```

**After:**
```svelte
<img
  src={netlifyImage(asset.url, { width: 800, format: 'webp' })}
  srcset={generateSrcset(asset.url)}
  alt={asset.description}
  loading="lazy"
/>
```

### 3. Profile Avatars

**Component:** User avatars in navigation, comments, profiles

**Before:**
```svelte
<img src={profile.avatarURL} alt="{profile.nick}'s avatar" />
```

**After:**
```svelte
<!-- Small avatar (nav) -->
<img
  src={netlifyImage(profile.avatarURL, { width: 48, format: 'webp', fit: 'cover' })}
  alt="{profile.nick}'s avatar"
  loading="lazy"
/>

<!-- Large avatar (profile page) -->
<img
  src={netlifyImage(profile.avatarURL, { width: 200, format: 'webp', fit: 'cover' })}
  srcset={generateSrcset(profile.avatarURL, [100, 200, 400], { format: 'webp', fit: 'cover' })}
  alt="{profile.nick}'s avatar"
/>
```

---

## Configuration Requirements

### Netlify Configuration

**File:** `netlify.toml`

Add cache headers for optimized images:

```toml
# Add to existing netlify.toml

[[headers]]
  for = "/.netlify/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    X-Content-Type-Options = "nosniff"
```

### Firebase Storage CORS

Ensure Firebase Storage allows Netlify Image CDN requests:

```json
[
  {
    "origin": ["https://*.netlify.app", "https://mekanismi.com"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

**Note:** CORS configuration is managed in Firebase Console, not this repository.

---

## Testing Strategy

### Unit Tests

✅ Test function with various parameter combinations  
✅ Test input validation (invalid URLs, negative numbers, etc.)  
✅ Test srcset generation  
✅ Test non-Firebase URL handling

**Run:** `pnpm test src/utils/images/netlifyImage.test.ts`

### Manual Testing

**Test Cases:**

1. **Thread Image:**
   - Navigate to any thread with images
   - Open DevTools Network tab
   - Verify image requests use `/.netlify/images` URL
   - Verify WebP format in response headers
   - Check file size is smaller than original

2. **Responsive Images:**
   - Resize browser window to different widths
   - Verify different image sizes load (check Network tab)
   - Verify images look sharp on all viewport sizes

3. **Avatar Images:**
   - Check small avatars (navigation)
   - Check large avatars (profile page)
   - Verify correct sizing and format

4. **Performance:**
   - Run Lighthouse audit
   - Verify "Properly size images" check passes
   - Verify "Serve images in next-gen formats" check passes

### E2E Tests

Optional (can be added in future PBI):

```typescript
// e2e/image-optimization.spec.ts
test('should serve optimized images via Netlify CDN', async ({ page }) => {
  await page.goto('/threads/test-thread');
  
  const img = page.locator('article img').first();
  const src = await img.getAttribute('src');
  
  expect(src).toContain('/.netlify/images');
  
  const response = await page.request.get(src);
  expect(response.headers()['content-type']).toMatch(/webp|avif/);
});
```

---

## Success Criteria

### Must Have

- [x] `netlifyImage()` function implemented and tested
- [x] `generateSrcset()` helper function implemented
- [x] Unit tests with >90% coverage
- [x] Input validation handles edge cases
- [x] TypeScript types exported
- [x] JSDoc documentation for all public functions

### Should Have

- [ ] Integration example in at least one component
- [ ] Developer documentation (usage guide)
- [ ] Netlify cache headers configured

### Nice to Have

- [ ] E2E test for image optimization
- [ ] Performance comparison metrics
- [ ] Usage examples for all image types (thread, site, profile)

---

## Rollout Plan

### Phase 1: Create Utility (This PBI)

**Week 1:**
1. Implement `netlifyImage()` function
2. Implement `generateSrcset()` helper
3. Write unit tests
4. Document usage patterns
5. Add TypeScript path alias if needed (`@utils/images/netlifyImage`)

**Deliverables:**
- ✅ Tested utility function
- ✅ Full unit test coverage
- ✅ JSDoc documentation

### Phase 2: Gradual Integration (Future PBIs)

**Phase 2.1:** Update thread image display components  
**Phase 2.2:** Update site asset display components  
**Phase 2.3:** Update profile avatar components

### Phase 3: Monitoring (Ongoing)

- Track Firebase Storage bandwidth reduction
- Monitor Netlify image transformation usage
- Analyze page load performance improvements
- Adjust quality/size parameters based on metrics

---

## Non-Goals (Out of Scope)

❌ Changing upload logic (keep existing patterns)  
❌ Migrating to Astro Image component  
❌ Implementing image lazy loading (use native `loading="lazy"`)  
❌ Adding image placeholders or blur-up effects  
❌ Implementing E2E tests (can be separate PBI)  
❌ Updating all components (just create utility, integration is separate PBIs)

---

## Risks & Mitigations

### Risk: Netlify Image CDN Rate Limits

**Likelihood:** Low  
**Impact:** High  
**Mitigation:** 
- Monitor Netlify dashboard for usage
- Netlify Free plan includes generous image transformation limits
- Can upgrade plan if needed
- Implement client-side caching strategies

### Risk: CORS Issues with Firebase Storage

**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Document CORS configuration in PBI
- Test with production Firebase Storage
- Provide fallback to original URL if transformation fails

### Risk: Breaking Existing Image Display

**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Function returns original URL on error
- Gradual rollout (utility first, then integration)
- No breaking changes to existing code

### Risk: CDN Cache Invalidation

**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- Netlify automatically handles cache invalidation
- URL includes original Firebase URL (cache busts when URL changes)
- Can manually purge Netlify cache if needed

---

## Dependencies

### Required

- ✅ Netlify hosting (already in place)
- ✅ Firebase Storage (already in place)
- ✅ `@netlify/images` package (already installed: v1.2.8)

### Optional

- Firebase Storage CORS configuration (can be added later)
- Netlify cache header configuration (can be added later)

---

## Cost-Benefit Analysis

### Development Effort

**Estimated Time:** 1-2 days  
**Complexity:** Low

**Breakdown:**
- Implementation: 2-3 hours
- Testing: 2-3 hours
- Documentation: 1-2 hours
- Code review: 1 hour

### Expected Benefits

**Performance:**
- 60-80% reduction in image file sizes (AVIF/WebP vs JPEG)
- Faster page loads (smaller files + CDN edge delivery)
- Better mobile experience (responsive images)

**Cost Savings:**
- ~70% reduction in Firebase Storage bandwidth
- Estimated savings: $0.35 per 1000 image views
- With 10k monthly image views: ~$3.50/month savings

**Developer Experience:**
- Reusable utility for all future image work
- Clean, documented API
- Type-safe with TypeScript
- Easy to test and maintain

**User Experience:**
- Faster page loads
- Less data usage on mobile
- Better image quality (modern formats)

### ROI Calculation

**Investment:** 8-12 hours development time  
**Returns:**
- Immediate: Better performance metrics
- Monthly: ~$3-10 in bandwidth savings (scales with traffic)
- Long-term: Foundation for image optimization across entire app

**Payback Period:** < 1 month (considering time saved + bandwidth costs)

---

## Documentation Updates

### Developer Docs

Create or update:
- `docs/image-optimization.md` - Guide for using `netlifyImage()`
- `README.md` - Add image optimization to architecture notes

### Code Documentation

- JSDoc for all exported functions
- TypeScript interfaces with clear descriptions
- Usage examples in comments

---

## Acceptance Criteria

- [ ] `netlifyImage()` function exists at `src/utils/images/netlifyImage.ts`
- [ ] Function accepts Firebase Storage URL and options object
- [ ] Function returns Netlify Image CDN URL with query parameters
- [ ] Input validation handles edge cases (empty URL, non-Firebase URLs, invalid params)
- [ ] `generateSrcset()` helper generates responsive image srcset strings
- [ ] Unit tests achieve >90% code coverage
- [ ] TypeScript types exported and documented
- [ ] All public functions have JSDoc documentation with examples
- [ ] Function handles errors gracefully (returns original URL on failure)
- [ ] Can be imported via path alias: `@utils/images/netlifyImage`

---

## Related Documents

- **Source Analysis:** `docs/file-upload-analysis.md`
- **Netlify Image CDN Docs:** https://docs.netlify.com/image-cdn/overview/
- **Firebase Storage:** https://firebase.google.com/docs/storage

---

## Implementation Checklist

### Code

- [ ] Create `src/utils/images/netlifyImage.ts`
- [ ] Implement `netlifyImage()` function
- [ ] Implement `generateSrcset()` helper
- [ ] Add input validation
- [ ] Add error handling
- [ ] Export TypeScript types

### Tests

- [ ] Create `src/utils/images/netlifyImage.test.ts`
- [ ] Test basic URL generation
- [ ] Test all parameter options
- [ ] Test input validation
- [ ] Test error cases
- [ ] Test srcset generation
- [ ] Verify >90% coverage

### Documentation

- [ ] Add JSDoc to all public functions
- [ ] Include usage examples in comments
- [ ] Document TypeScript interfaces
- [ ] Add README note about image optimization

### Configuration

- [ ] Add TypeScript path alias (if needed)
- [ ] Update `netlify.toml` with cache headers (optional)
- [ ] Document Firebase CORS requirements

### Quality

- [ ] Run Biome linter
- [ ] Run Biome formatter
- [ ] Type check passes
- [ ] All tests pass
- [ ] Code review completed

---

## Future Enhancements

These are **out of scope** for this PBI but can be considered for future work:

1. **Automatic blur-up placeholders** - Generate low-res placeholder while loading
2. **Art direction support** - Different crops for different viewports
3. **Lazy loading wrapper component** - Svelte component that handles lazy loading
4. **Image analytics** - Track which image sizes are used most
5. **Automatic quality adjustment** - Adjust quality based on image content
6. **Integration with Astro Image** - Unified approach for SSR pages
7. **Presets for common use cases** - e.g., `netlifyImage.avatar()`, `netlifyImage.hero()`
