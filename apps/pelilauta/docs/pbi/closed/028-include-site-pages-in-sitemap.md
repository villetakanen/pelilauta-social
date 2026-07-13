# PBI-028: Include Site Pages in Sitemap

## Status
✅ Complete - Implemented October 14, 2025

## Implementation Summary (October 14, 2025)

### Changes Made
**Site Pages in Sitemap** ✅
- Modified `src/pages/sitemap.xml.ts` to iterate through `pageRefs` array from public sites
- Generate page URLs in format: `/sites/{siteKey}/{pageKey}`
- Set priority to 0.5 (same as threads, lower than site landing pages)
- Handles sites without `pageRefs` gracefully
- No additional API calls needed - uses existing site data

### Technical Implementation
```typescript
// Generate URLs for all pages in public sites (PBI-028)
const publicSitePages: string[] = [];
for (const site of publicSitesJson) {
  if (site.pageRefs && Array.isArray(site.pageRefs)) {
    for (const pageRef of site.pageRefs) {
      publicSitePages.push(`/sites/${site.key}/${pageRef.key}`);
    }
  }
}
```

### Testing & Validation
- ✅ Biome linting passed
- ✅ Astro type checking passed (0 errors)
- ✅ Full build completed successfully
- ✅ URL format validated: `/sites/{siteKey}/{pageKey}`
- ✅ XML structure maintained correctly
- ✅ Handles edge cases (sites without pageRefs)

### Impact
- Improved SEO for all wiki pages and content within public sites
- Better discoverability through search engines
- Scalable solution that works automatically for all public sites
- Efficient implementation without additional API overhead

---

## Priority
Medium

## Description
Currently, the sitemap.xml only includes the main site URLs (e.g., `/sites/mekanismi`) but does not include individual pages within each site. This limits SEO discoverability for wiki pages and other content within sites.

The site schema already includes a `pageRefs` array with metadata for all pages, so we can efficiently add all public site pages to the sitemap without making additional API calls.

## Current Behavior
The sitemap.xml includes:
- Static important pages (front page, /sites, /channels)
- Featured tags
- Public site landing pages (e.g., `/sites/mekanismi`)
- Latest public threads

Example for mekanismi site:
```xml
<url>
  <loc>https://mekanismi.com/sites/mekanismi</loc>
  <priority>0.6</priority>
</url>
```

## Desired Behavior
The sitemap.xml should also include all pages from public sites, using the `pageRefs` data already available in the site objects.

Example additions for mekanismi site pages:
```xml
<url>
  <loc>https://mekanismi.com/sites/mekanismi/24hqR7V4GJr45Y8jDGYT</loc>
  <priority>0.5</priority>
</url>
<url>
  <loc>https://mekanismi.com/sites/mekanismi/O3ToX8oyWfOgaG771Z5d</loc>
  <priority>0.5</priority>
</url>
<!-- ... more pages ... -->
```

## Benefits
- ✅ **Improved SEO**: Individual wiki pages can be indexed by search engines
- ✅ **Better discoverability**: Users can find specific content directly via search
- ✅ **Efficient implementation**: No additional API calls needed (data already in site objects)
- ✅ **Scalable**: Works for all public sites automatically

## Technical Notes

### Data Source
The `/api/sites` endpoint returns site objects with `pageRefs` array:
```typescript
{
  key: "mekanismi",
  name: "Mekanismi",
  hidden: false,
  pageRefs: [
    {
      key: "24hqR7V4GJr45Y8jDGYT",
      name: "Powered by the Apocalypse",
      author: "...",
      category: "Kirjasto",
      flowTime: 1759842568000
    },
    // ... more pages
  ]
}
```

### Implementation
In `src/pages/sitemap.xml.ts`:
1. After fetching public sites, iterate through each site's `pageRefs` array
2. Generate page URLs in format: `/sites/{siteKey}/{pageKey}`
3. Set appropriate priority (suggested: 0.5, slightly lower than site landing pages at 0.6)
4. Filter out pages if needed (though all pages in public sites should be public)

### Priority Hierarchy
```
0.9 - Front page
0.8 - Static pages (/sites, /channels)
0.7 - Featured tags
0.6 - Public site landing pages
0.5 - Public site pages (NEW)
0.5 - Public threads
```

## Example Sites with Pages
- **mekanismi**: 18 pages (public wiki)
- Other public sites with pages will also benefit

## File to Modify
- `src/pages/sitemap.xml.ts` - Add page URL generation from `pageRefs`

## Testing
1. Verify sitemap includes pages from mekanismi site
2. Check that page URLs are correctly formatted: `/sites/{siteKey}/{pageKey}`
3. Verify sitemap remains valid XML
4. Test sitemap size doesn't exceed limits (currently not a concern, but monitor)
5. Confirm pages are actually accessible at the generated URLs

## Related
- PBI-024: SEO optimization and public page documentation
- PBI-027: Advanced tag support and SEO tag links
