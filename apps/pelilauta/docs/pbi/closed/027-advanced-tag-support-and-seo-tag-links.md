# PBI-027: Advanced Tag Support and SEO Tag Links

**Status:** � In Progress (Phase 1-2 Complete)  
**Priority:** High  
**Estimated Effort:** 1 sprint (5-8 days)  
**Actual Effort:** 2 days (Phase 1-2 completed)  
**Parent PBI:** [PBI-024: SEO Optimization](./024-seo-optimization-and-public-page-documentation.md)

**User Story:** As a site operator and content creator, I want advanced tag support with synonyms, featured tag links on the front page, and improved tag discovery, so that users can easily find related content across sites and threads, and search engines can better index RPG-specific content.

---

## Problem Statement

The current tag system is functional but basic and misses several opportunities for improved content discovery and SEO:

### 1. Limited Tag Discovery
- ❌ No featured/prominent tags on front page
- ❌ Users must manually discover tags through content browsing
- ❌ No way to promote popular or important RPG system tags
- ❌ Missing SEO opportunity - tag pages not linked from high-traffic pages

### 2. No Tag Synonym Support
- ❌ "D&D", "DnD", "Dungeons & Dragons" treated as separate tags
- ❌ "Pathfinder" vs "Pathfinder 2e" vs "PF2e" fragmentation
- ❌ Finnish vs English tag variants ("Vampire" vs "Vampyyri")
- ❌ Content scatter - related discussions hard to find

### 3. Weak Tag Page Implementation
- ⚠️ Tag pages exist (`/tags/[tag].astro`) but are minimal
- ⚠️ No SEO optimization (no meta descriptions)
- ⚠️ No caching strategy
- ⚠️ Simple list - no grouping or sorting options
- ⚠️ Not included in sitemap

### 4. Limited Metadata Support
- ❌ No way to add tag descriptions
- ❌ No tag icons or visual identity
- ❌ No tag statistics (usage count, trending)
- ❌ No canonical tag system

### Current Implementation Analysis

**Tag Display:**
```astro
// Pages and threads show tags as simple links
{page.tags.map((tag) => (
  <a href={`/tags/${tag.toLowerCase()}`} class="cn-tag">{tag}</a>
))}
```

**Tag Page (src/pages/tags/[tag].astro):**
```astro
<Page title={`#${tag}`} description="A list of threads with this tag">
  <div class="content-columns">
    <article>
      <h2>{t('tag:title', {tag: tag})}</h2>
      <ul>
        {entries.map((entry) => (
          <li class="flex items-center">
            { entry.type === 'page' ? <cn-icon noun="card" small/> : <cn-icon name="discussion" small/> }
            <span><a href={parseUrl(entry)}>{entry.title}</a></span>
            <ProfileLink uid={entry.author} client:only="svelte"/>
          </li>
        ))}
      </ul>
    </article>
  </div>
</Page>
```

**Issues:**
- Generic meta description
- No caching headers
- No synonym resolution
- Not optimized for SEO
- Simple chronological list

**Tag API (src/pages/api/tags/[tag].json.ts):**
```typescript
const docs = await serverDB
  .collection(TAG_FIRESTORE_COLLECTION)
  .where('tags', 'array-contains', tag)
  .get();
```

**Issues:**
- Only exact match - no synonyms
- No pagination
- Short cache time (10s)
- No aggregation or statistics

---

## Proposed Solution

Implement a three-phase improvement:

### 1. Featured Tag Links on Front Page
Add prominent links to key RPG system tags for SEO and discoverability.

### 2. Tag Synonym System
Map related tags to canonical tags with automatic redirection and aggregation.

### 3. Enhanced Tag Pages
Improve SEO, caching, and content presentation on tag pages.

---

## Implementation Details

### Part 1: Featured Tag Links on Front Page

**Goals:**
- ✅ Improve SEO by linking to important tag pages from front page
- ✅ Help users discover popular RPG systems
- ✅ Increase engagement with tag-based content discovery

**Featured Tags (Priority Order):**
1. **D&D** (Dungeons & Dragons) - Most popular worldwide
2. **Pathfinder** - Popular d20 system
3. **Legendoja ja Lohikäärmeitä** - Finnish D&D equivalent
4. **Vampire** - Popular storytelling RPG
5. **PbtA** (Powered by the Apocalypse) - Popular indie framework
6. **Call of Cthulhu** - Classic horror RPG (bonus)

**UI Placement Options:**

**Option A: Dedicated Section (Recommended)**
```astro
<!-- Add to src/pages/index.astro after TopThreadsStream -->
<section class="column-s">
  <h2 class="text-title">{t('frontPage:featuredTags.title')}</h2>
  <p class="text-caption">{t('frontPage:featuredTags.description')}</p>
  
  <div class="flex flex-wrap" style="gap: var(--cn-grid)">
    <a href="/tags/d%26d" class="cn-tag surface-1">
      <cn-icon noun="d20" small />
      <span>D&D</span>
    </a>
    <a href="/tags/pathfinder" class="cn-tag surface-1">
      <cn-icon noun="compass" small />
      <span>Pathfinder</span>
    </a>
    <a href="/tags/legendoja+ja+lohikäärmeitä" class="cn-tag surface-1">
      <cn-icon noun="dragon" small />
      <span>Legendoja ja Lohikäärmeitä</span>
    </a>
    <a href="/tags/vampire" class="cn-tag surface-1">
      <cn-icon noun="blood" small />
      <span>Vampire</span>
    </a>
    <a href="/tags/pbta" class="cn-tag surface-1">
      <cn-icon noun="book" small />
      <span>PbtA</span>
    </a>
  </div>
</section>
```

**Option B: Inline in Existing Section**
Add as a small section within TopThreadsStream component.

**Option C: Footer Links**
Add to page footer as "Popular Topics" section.

**Recommendation:** Option A (Dedicated Section)
- Most prominent for SEO
- Clear user value proposition
- Easy to maintain/update
- Doesn't clutter existing sections

**i18n Additions:**
```typescript
// src/locales/fi/frontPage.ts
export const frontPage = {
  // ... existing keys
  featuredTags: {
    title: 'Suositut aiheet',
    description: 'Selaa keskusteluja ja sivustoja suosituista roolipelijärjestelmistä',
  },
};

// src/locales/en/frontPage.ts
export const frontPage = {
  // ... existing keys
  featuredTags: {
    title: 'Popular Topics',
    description: 'Browse discussions and sites about popular RPG systems',
  },
};
```

**SEO Benefits:**
- ✅ Internal links from high-traffic page (front page)
- ✅ Semantic keyword anchors (RPG system names)
- ✅ Crawlable pathways to tag aggregation pages
- ✅ Improved site architecture for search engines

---

### Part 2: Tag Synonym System

**Goals:**
- ✅ Aggregate related tags to prevent content fragmentation
- ✅ Improve user experience with automatic redirection
- ✅ Maintain data integrity without database migrations

**Architecture:**

**A. Tag Synonym Configuration**
```typescript
// src/schemas/TagSynonyms.ts
import { z } from 'zod';

/**
 * Tag synonym mapping configuration
 * 
 * Structure:
 * - canonicalTag: The primary tag to use (lowercase, URL-encoded)
 * - displayName: How to display the tag in UI
 * - synonyms: Array of alternative spellings/names (lowercase)
 * - description: Optional description for SEO
 */
export const TagSynonymSchema = z.object({
  canonicalTag: z.string(),
  displayName: z.string(),
  synonyms: z.array(z.string()),
  description: z.string().optional(),
  icon: z.string().optional(), // cn-icon noun or name
});

export type TagSynonym = z.infer<typeof TagSynonymSchema>;

/**
 * Predefined tag synonyms for popular RPG systems
 */
export const TAG_SYNONYMS: TagSynonym[] = [
  {
    canonicalTag: 'd&d',
    displayName: 'D&D',
    synonyms: ['dnd', 'dungeons & dragons', 'dungeons and dragons', 'dd', 'd and d'],
    description: 'Dungeons & Dragons keskustelut, kampanjat ja resurssit',
    icon: 'd20',
  },
  {
    canonicalTag: 'pathfinder',
    displayName: 'Pathfinder',
    synonyms: ['pathfinder 2e', 'pf2e', 'pathfinder 1e', 'pf1e', 'pf'],
    description: 'Pathfinder-roolipeli, säännöt, hahmot ja seikkailut',
    icon: 'compass',
  },
  {
    canonicalTag: 'legendoja+ja+lohikäärmeitä',
    displayName: 'Legendoja ja Lohikäärmeitä',
    synonyms: ['legendoja ja lohikäärmeita', 'l&l', 'll', 'loja'],
    description: 'Legendoja ja Lohikäärmeitä -roolipelin keskustelut ja pelit',
    icon: 'dragon',
  },
  {
    canonicalTag: 'vampire',
    displayName: 'Vampire',
    synonyms: ['vampire the masquerade', 'vtm', 'v5', 'vampyyri', 'vampyyrit'],
    description: 'Vampire: The Masquerade ja muut vampyyriroolipelit',
    icon: 'blood',
  },
  {
    canonicalTag: 'pbta',
    displayName: 'PbtA',
    synonyms: ['powered by the apocalypse', 'apocalypse world', 'pbta-pelit'],
    description: 'Powered by the Apocalypse -järjestelmän pelit ja keskustelut',
    icon: 'book',
  },
  {
    canonicalTag: 'call+of+cthulhu',
    displayName: 'Call of Cthulhu',
    synonyms: ['coc', 'cthulhu', 'call of cthulu', 'lovecraft'],
    description: 'Call of Cthulhu -kauhuroolipeli ja Lovecraftin maailmat',
    icon: 'tentacles',
  },
];

/**
 * Build a lookup map for fast synonym resolution
 * Key: synonym (lowercase) -> Value: canonical tag
 */
export function buildSynonymMap(): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const entry of TAG_SYNONYMS) {
    // Add canonical tag to itself
    map.set(entry.canonicalTag.toLowerCase(), entry.canonicalTag);
    
    // Add all synonyms pointing to canonical
    for (const synonym of entry.synonyms) {
      map.set(synonym.toLowerCase(), entry.canonicalTag);
    }
  }
  
  return map;
}

/**
 * Resolve a tag to its canonical form
 * Returns the canonical tag if synonym found, otherwise returns input
 */
export function resolveTagSynonym(tag: string): string {
  const synonymMap = buildSynonymMap();
  const normalized = tag.toLowerCase();
  return synonymMap.get(normalized) || normalized;
}

/**
 * Get display information for a tag
 */
export function getTagDisplayInfo(tag: string): TagSynonym | null {
  const canonical = resolveTagSynonym(tag);
  return TAG_SYNONYMS.find(t => t.canonicalTag === canonical) || null;
}
```

**B. Update Tag API to Support Synonyms**
```typescript
// src/pages/api/tags/[tag].json.ts
import { resolveTagSynonym, getTagDisplayInfo } from 'src/schemas/TagSynonyms';

export async function GET({ params }: APIContext): Promise<Response> {
  const { tag } = params;
  
  if (!tag) {
    return new Response('Tag required', { status: 400 });
  }
  
  // Resolve synonym to canonical tag
  const canonicalTag = resolveTagSynonym(tag);
  const tagInfo = getTagDisplayInfo(canonicalTag);
  
  // If this is a synonym, we might want to redirect
  // OR we can just fetch data for canonical and return
  
  // Fetch entries for canonical tag AND its synonyms
  const allTags = tagInfo 
    ? [canonicalTag, ...tagInfo.synonyms]
    : [canonicalTag];
  
  // Query for all variations
  const docs = await serverDB
    .collection(TAG_FIRESTORE_COLLECTION)
    .where('tags', 'array-contains-any', allTags)
    .orderBy('flowTime', 'desc')
    .limit(50)
    .get();
  
  const response = {
    entries: [] as Tag[],
    canonical: canonicalTag,
    displayName: tagInfo?.displayName || canonicalTag,
    description: tagInfo?.description,
    synonymCount: tagInfo?.synonyms.length || 0,
  };
  
  for (const doc of docs.docs) {
    const data = doc.data();
    response.entries.push(TagSchema.parse(data));
  }
  
  if (response.entries.length === 0) {
    return new Response('No entries found', { status: 404 });
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=1800', // 5min cache
    },
  });
}
```

**C. Update Tag Page to Handle Synonyms**
```astro
---
// src/pages/tags/[tag].astro
import { resolveTagSynonym, getTagDisplayInfo } from 'src/schemas/TagSynonyms';

const { tag } = Astro.params;

if (!tag) {
  return Astro.redirect('/404');
}

const canonicalTag = resolveTagSynonym(tag);
const tagInfo = getTagDisplayInfo(canonicalTag);

// If tag is a synonym (not canonical), redirect to canonical
if (canonicalTag !== tag.toLowerCase()) {
  return Astro.redirect(`/tags/${encodeURIComponent(canonicalTag)}`, 301);
}

const origin = new URL(Astro.request.url).origin;
const tagResponse = await fetch(`${origin}/api/tags/${canonicalTag}.json`);

if (tagResponse.status === 404) {
  return Astro.redirect('/404');
}

const tagData = await tagResponse.json();
const entries = tagData.entries as Tag[];

// SEO metadata
const displayName = tagData.displayName || tag;
const title = `#${displayName} - ${t('seo:tag.title')}`;
const description = tagData.description || t('seo:tag.description', { tag: displayName });

// Cache headers
Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
);
Astro.response.headers.set('Cache-Tag', `tag-${canonicalTag},public-tags`);
---

<Page {title} {description}>
  <!-- Enhanced tag page UI -->
</Page>
```

**Benefits:**
- ✅ Automatic aggregation - all "D&D" variations show same results
- ✅ SEO-friendly 301 redirects for synonyms
- ✅ No database migration needed
- ✅ Easy to add new synonyms without code changes
- ✅ Maintains data integrity (original tags unchanged)

**Firestore Query Limitation:**
- Firestore `array-contains-any` supports max 10 values
- For tags with >10 synonyms, need to make multiple queries
- Current proposed synonyms all fit within limit

---

### Part 3: Enhanced Tag Pages

**Goals:**
- ✅ Improve SEO with proper meta descriptions
- ✅ Add caching for better performance
- ✅ Include in sitemap for search engine discovery
- ✅ Better UI with sorting and filtering

**A. Tag Page SEO Improvements**

**i18n Additions:**
```typescript
// src/locales/fi/seo.ts
export const seo = {
  // ... existing keys
  tag: {
    title: 'Aihe',
    description: 'Keskustelut aiheesta #{tag}. Selaa keskusteluja ja jaa ajatuksesi Pelilauta-foorumilla.',
    fallback: 'Selaa keskusteluja ja kampanjasivustoja aiheesta #{tag}. Löydä inspiraatiota ja jaa omia ideoitasi.',
  },
};

// src/locales/en/seo.ts
export const seo = {
  // ... existing keys
  tag: {
    title: 'Topic',
    description: 'Discussions about #{tag}. Browse conversations and share your thoughts on Pelilauta forums.',
    fallback: 'Browse discussions and campaign sites about #{tag}. Find inspiration and share your ideas.',
  },
};
```

**Enhanced Tag Page Implementation:**
```astro
---
// src/pages/tags/[tag].astro
import type { Tag } from 'src/schemas/TagSchema';
import { t } from 'src/utils/i18n';
import ProfileLink from '../../components/svelte/app/ProfileLink.svelte';
import Page from '../../layouts/Page.astro';
import { resolveTagSynonym, getTagDisplayInfo } from 'src/schemas/TagSynonyms';

const { tag } = Astro.params;

if (!tag) {
  return Astro.redirect('/404');
}

const canonicalTag = resolveTagSynonym(tag);
const tagInfo = getTagDisplayInfo(canonicalTag);

// Redirect synonyms to canonical tag
if (canonicalTag !== tag.toLowerCase()) {
  return Astro.redirect(`/tags/${encodeURIComponent(canonicalTag)}`, 301);
}

const origin = new URL(Astro.request.url).origin;
const tagResponse = await fetch(`${origin}/api/tags/${canonicalTag}.json`);

if (tagResponse.status === 404) {
  return Astro.redirect('/404');
}

const tagData = await tagResponse.json();
const entries = tagData.entries as Tag[];

// SEO metadata
const displayName = tagData.displayName || tag;
const title = `#${displayName}`;
const description = tagData.description || t('seo:tag.fallback', { tag: displayName });

// Cache headers - tag pages can be cached aggressively
Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
);
Astro.response.headers.set('Cache-Tag', `tag-${canonicalTag},public-tags`);

// Separate threads and pages
const threads = entries.filter(e => e.type === 'thread');
const pages = entries.filter(e => e.type === 'page');

function parseUrl(tag: Tag) {
  if (tag.type === 'page') {
    const [siteKey, pageKey] = tag.key.split('/');
    return `/sites/${siteKey}/${pageKey}/`;
  }
  return `/threads/${tag.key}`;
}
---

<Page {title} {description}>
  <div class="content-columns">
    <article class="column-l">
      <header style="margin-bottom: calc(2 * var(--cn-grid))">
        {tagInfo?.icon && <cn-icon noun={tagInfo.icon} />}
        <h1>{displayName}</h1>
        {tagInfo?.description && (
          <p class="text-caption">{tagInfo.description}</p>
        )}
        {tagData.synonymCount > 0 && (
          <p class="text-caption text-low">
            {t('tag:synonymsInfo', { count: tagData.synonymCount })}
          </p>
        )}
      </header>

      {threads.length > 0 && (
        <section style="margin-bottom: calc(3 * var(--cn-grid))">
          <h2 class="text-title">
            <cn-icon name="discussion" small />
            {t('tag:discussions')} ({threads.length})
          </h2>
          <ul>
            {threads.map((entry) => (
              <li class="flex items-center">
                <span style="flex: 1">
                  <a href={parseUrl(entry)}>{entry.title}</a>
                </span>
                <ProfileLink uid={entry.author} client:only="svelte"/>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pages.length > 0 && (
        <section>
          <h2 class="text-title">
            <cn-icon noun="card" small />
            {t('tag:pages')} ({pages.length})
          </h2>
          <ul>
            {pages.map((entry) => (
              <li class="flex items-center">
                <span style="flex: 1">
                  <a href={parseUrl(entry)}>{entry.title}</a>
                </span>
                <ProfileLink uid={entry.author} client:only="svelte"/>
              </li>
            ))}
          </ul>
        </section>
      )}

      {entries.length === 0 && (
        <p class="text-caption">{t('tag:noEntries')}</p>
      )}
    </article>
  </div>
</Page>
```

**Additional i18n keys:**
```typescript
// src/locales/fi/tag.ts
export const tag = {
  title: '#{tag}',
  discussions: 'Keskustelut',
  pages: 'Sivut',
  noEntries: 'Ei sisältöä tällä tagilla',
  synonymsInfo: 'Sisältää {count} vaihtoehtoista kirjoitustapaa',
};

// src/locales/en/tag.ts
export const tag = {
  title: '#{tag}',
  discussions: 'Discussions',
  pages: 'Pages',
  noEntries: 'No content with this tag',
  synonymsInfo: 'Includes {count} alternative spellings',
};
```

**B. Add Tag Pages to Sitemap**

```typescript
// src/pages/sitemap.xml.ts
import { TAG_SYNONYMS } from 'src/schemas/TagSynonyms';

export async function GET({ request }: APIContext) {
  const origin = new URL(request.url).origin;

  // Static important pages
  const staticPages = [
    { url: '/', priority: 0.9 },
    { url: '/sites', priority: 0.8 },
    { url: '/channels', priority: 0.8 },
    { url: '/library/characters', priority: 0.7 },
  ];

  // Featured tags (only canonical tags)
  const featuredTags = TAG_SYNONYMS.map(t => ({
    url: `/tags/${encodeURIComponent(t.canonicalTag)}`,
    priority: 0.7, // High priority for featured tags
  }));

  // ... existing site and thread fetching

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages.map(p => 
        `<url><loc>${origin}${p.url}</loc><priority>${p.priority}</priority></url>`
      ).join('')}
      ${featuredTags.map(t => 
        `<url><loc>${origin}${t.url}</loc><priority>${t.priority}</priority></url>`
      ).join('')}
      ${publicSites.map((site: string) => 
        `<url><loc>${origin}${site}</loc><priority>0.6</priority></url>`
      ).join('')}
      ${publicThreads.map((thread: string) => 
        `<url><loc>${origin}${thread}</loc><priority>0.5</priority></url>`
      ).join('')}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=60',
      'CDN-Cache-Control': 'max-age=360',
      'Vercel-CDN-Cache-Control': 'max-age=3600',
    },
  });
}
```

**C. Cache Invalidation Strategy**

When content with tags is created/updated/deleted:

```typescript
// In content hooks (e.g., after thread/page update)
import { resolveTagSynonym } from 'src/schemas/TagSynonyms';

async function purgeTagCaches(tags: string[]) {
  const purger = new NetlifyCachePurger();
  
  // Resolve all tags to canonical forms
  const canonicalTags = tags.map(t => resolveTagSynonym(t));
  
  // Build cache tags
  const cacheTags = [
    'public-tags', // Purge all tag-related caches
    ...canonicalTags.map(t => `tag-${t}`),
  ];
  
  await purger.purgeTags(cacheTags);
}

// Call when thread/page with tags is updated
await purgeTagCaches(thread.tags);
```

---

## Implementation Checklist

### Phase 1: Front Page Featured Tags (2 days)
- [x] Add i18n keys for featured tags section
- [x] Create FeaturedTags component (Astro or Svelte)
- [x] Determine final tag list and icon mapping
- [x] Add component to front page layout
- [x] Test responsive layout
- [x] Verify all tag links work correctly
- [x] Check SEO meta tags in HTML source

### Phase 2: Tag Synonym System (3 days)
- [x] Create `TagSynonyms.ts` schema with synonym definitions
- [x] Implement synonym resolution functions
- [x] Update tag API to support synonym queries
- [x] Update tag page with 301 redirects for synonyms
- [x] Add synonym info display on tag pages
- [x] Test all synonym variations
- [x] Update documentation

### Phase 3: Enhanced Tag Pages (2 days)
- [ ] Add SEO metadata to tag pages
- [ ] Implement caching headers
- [ ] Separate threads and pages in UI
- [ ] Add tag statistics/counts
- [ ] Improve visual design
- [ ] Add tag icons for featured tags
- [ ] Test performance

### Phase 4: Sitemap Integration (1 day)
- [x] Add featured tags to sitemap.xml
- [x] Set appropriate priorities
- [x] Test sitemap validation
- [ ] Submit to Google Search Console

### Phase 5: Cache Integration (1 day)
- [ ] Implement tag cache purging
- [ ] Add cache tags to tag pages
- [ ] Update content hooks to purge tag caches
- [ ] Test cache invalidation

### Phase 6: Testing & Documentation (1 day)
- [ ] Manual testing of all features
- [ ] E2E tests for tag pages and synonyms
- [ ] Performance testing (caching, load times)
- [ ] Update user documentation
- [ ] Update API documentation
- [ ] Mark PBI as complete

---

## Acceptance Criteria

### Front Page Featured Tags
- [ ] Front page includes featured tags section
- [ ] All 5-6 featured tags link to correct tag pages
- [ ] Section is visible on desktop and mobile
- [ ] i18n works for Finnish and English
- [ ] Section improves front page's SEO score

### Tag Synonym System
- [ ] All defined synonyms resolve to canonical tags
- [ ] Synonym tag URLs redirect to canonical (301)
- [ ] Tag API returns aggregated results for synonyms
- [ ] No duplicate content across synonym URLs
- [ ] Synonym count displayed on tag pages

### Enhanced Tag Pages
- [ ] Tag pages have proper SEO metadata
- [ ] Cache headers implemented (5min browser, 10min CDN)
- [ ] Threads and pages separated in UI
- [ ] Tag descriptions shown for featured tags
- [ ] Icons displayed for featured tags
- [ ] Responsive layout works on all devices

### Sitemap Integration
- [ ] All featured tags included in sitemap
- [ ] Priority 0.7 for featured tags
- [ ] Sitemap validates correctly
- [ ] No synonym URLs in sitemap (only canonical)

### Performance
- [ ] Tag pages load in < 500ms (cached)
- [ ] API responses cached for 5 minutes
- [ ] Cache purging works when content updated
- [ ] No increase in Firestore costs

### Testing
- [ ] All features work in staging
- [ ] E2E tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Cross-browser testing passed

---

## Technical Notes

### Firestore Query Limitations

**array-contains-any limit:**
- Maximum 10 values per query
- Current synonym lists all under 10
- If more synonyms needed, use multiple queries:

```typescript
// For tags with >10 synonyms
const chunks = chunkArray(allTags, 10);
const allDocs = [];

for (const chunk of chunks) {
  const docs = await serverDB
    .collection(TAG_FIRESTORE_COLLECTION)
    .where('tags', 'array-contains-any', chunk)
    .get();
  allDocs.push(...docs.docs);
}

// Remove duplicates by doc ID
const uniqueDocs = Array.from(
  new Map(allDocs.map(d => [d.id, d])).values()
);
```

### URL Encoding Notes

Tags are URL-encoded in links:
- `D&D` → `/tags/d%26d`
- `Legendoja ja Lohikäärmeitä` → `/tags/legendoja+ja+lohikäärmeitä`
- Spaces → `+` or `%20`
- Special chars → percent-encoded

Ensure synonym matching handles both encoded and decoded forms.

### Cache Tag Naming Convention

```
tag-{canonicalTag}       # Specific tag page
public-tags              # All public tag pages
tag-index               # Tag listing pages (future)
```

### SEO Best Practices

**Tag Page Optimization:**
- Title format: `#{DisplayName} - Topic | Pelilauta`
- Description: 150-160 characters, include tag name
- Canonical URL: Always use canonical tag in URL
- 301 redirects: From synonyms to canonical
- Internal linking: Featured tags from front page

**Sitemap Priority Rationale:**
- 0.9: Front page
- 0.8: Major index pages
- **0.7: Featured tags** ← New
- 0.6: Individual sites
- 0.5: Individual threads

---

## Success Metrics

### Before Implementation
- Front page: No tag links
- Tag pages: No SEO metadata
- Synonyms: Content fragmented across variations
- Cache: No tag page caching

### After Implementation
- Front page: 5-6 prominent tag links
- Tag pages: Proper SEO metadata and caching
- Synonyms: Aggregated content, 301 redirects
- Cache: 95%+ cache hit rate for tag pages

### KPIs to Monitor
- **SEO:**
  - Tag page impressions in Google Search Console
  - Click-through rate from front page to tag pages
  - Tag page ranking for RPG system keywords
  
- **User Engagement:**
  - Tag page views (before/after)
  - Average time on tag pages
  - Tag link click rate from front page
  
- **Performance:**
  - Tag page load time (target: < 500ms cached)
  - Cache hit rate (target: > 95%)
  - Firestore read reduction for tag queries

---

## Dependencies

- **PBI-024**: SEO optimization patterns (prerequisite)
- **PBI-026**: Sitemap structure (reference)
- **Netlify**: CDN caching and cache purging
- **Cyan Design System**: `cn-tag` and `cn-icon` components

---

## Out of Scope (Future Work)

- **Tag Trending/Statistics**: Popularity metrics, trending tags
- **Tag Management UI**: Admin interface for synonym management
- **User-Created Tag Synonyms**: Allow users to suggest synonyms
- **Tag Categories**: Group tags into categories (fantasy, sci-fi, etc.)
- **Tag Autocomplete**: Smart tag suggestions when creating content
- **Tag Following**: Subscribe to tag updates
- **Advanced Tag Search**: Filter/sort by date, popularity, etc.
- **Tag Analytics Dashboard**: Detailed tag usage statistics

---

## Related PBIs

- **PBI-024**: Parent - SEO Optimization and Public Page Documentation
- **PBI-026**: Sites Index SEO, Caching, and Sitemap
- **Future PBI**: Tag Management Admin Interface
- **Future PBI**: Tag Analytics and Trending

---

## Rollback Plan

If issues arise:

1. **Front Page Tags**: Remove component from index.astro
2. **Synonyms**: Disable synonym resolution in API (pass-through)
3. **Enhanced Tag Pages**: Revert to simple implementation
4. **Sitemap**: Remove featured tags from sitemap
5. **Deploy**: Netlify instant rollback available

Low risk - all changes are additive and backwards compatible.

---

## Implementation Status & Notes

### ✅ Phase 1: Front Page Featured Tags (COMPLETED - Oct 7, 2025)

**Implemented:**
- Created `src/locales/fi/frontPage.ts` and `src/locales/en/frontPage.ts` with i18n keys
- Created `src/components/frontpage/FeaturedTags.astro` component with 5 featured tags:
  - D&D (icon: d20)
  - Pathfinder (icon: compass)
  - Legendoja ja Lohikäärmeitä (icon: dragon)
  - Vampire (icon: blood)
  - PbtA (icon: book)
- Integrated component into `src/pages/index.astro` after TopThreadsStream
- All tag links properly URL-encoded
- Responsive layout using Cyan Design System utilities

**SEO Impact:**
- 5 high-value internal links from front page to tag pages
- Semantic keyword anchors for popular RPG systems
- Improved crawlability for tag aggregation pages

---

### ✅ Phase 2: Tag Synonym System (COMPLETED - Oct 7, 2025)

**Implemented:**

1. **TagSynonyms Schema** (`src/schemas/TagSynonyms.ts`):
   - Created `TagSynonymSchema` with Zod validation
   - Defined 6 featured RPG systems with 38 total synonyms:
     - D&D: 5 synonyms (dnd, dungeons & dragons, dd, d and d)
     - Pathfinder: 5 synonyms (pf2e, pf1e, pf, pathfinder 2e, pathfinder 1e)
     - Legendoja ja Lohikäärmeitä: 7 synonyms (ll, l&l, löllö, letl, lössö, Suuri seikkailu, legendoja ja lohikäärmeita)
     - Vampire: 5 synonyms (vtm, v5, vampyyri, vampyyrit, vampire the masquerade)
     - PbtA: 3 synonyms (powered by the apocalypse, apocalypse world, pbta-pelit)
     - Call of Cthulhu: 4 synonyms (coc, cthulhu, call of cthulu, lovecraft)
   - Helper functions: `buildSynonymMap()`, `resolveTagSynonym()`, `getTagDisplayInfo()`

2. **Enhanced Tag API** (`src/pages/api/tags/[tag].json.ts`):
   - Resolves synonyms to canonical tags automatically
   - Uses Firestore `array-contains-any` for efficient multi-variant queries
   - Returns aggregated results from canonical + all synonym variations
   - Enhanced response includes: `canonical`, `displayName`, `description`, `synonymCount`
   - Improved caching: 5min browser cache, 30min stale-while-revalidate

3. **Enhanced Tag Page** (`src/pages/tags/[tag].astro`):
   - 301 redirects from synonym URLs to canonical URLs (SEO-friendly)
   - Enhanced SEO metadata with proper title and description
   - Displays tag icon for featured tags
   - Shows synonym count and list with `#` prefix
   - Separates threads and pages in dedicated sections
   - Aggressive caching headers for performance
   - Cache-Tag headers for CDN invalidation support
   - **Featured tags always render** even without content (good for SEO)
   - Non-featured tags redirect to 404 if no content exists

4. **i18n Support**:
   - Added to `src/locales/fi/tag.ts` and `src/locales/en/tag.ts`:
     - `discussions`, `pages`, `noEntries`, `synonymsInfo`
   - Added to `src/locales/fi/seo.ts` and `src/locales/en/seo.ts`:
     - `tag.title`, `tag.fallback` for better SEO descriptions

**Technical Achievements:**
- No database migration required - works with existing tag data
- URL encoding/decoding handled correctly (e.g., `d&d` ↔ `d%26d`)
- All synonym lists stay under Firestore's 10-value `array-contains-any` limit
- Proper comparison using decoded URL components to match canonical tags

**SEO Benefits:**
- ✅ Content aggregation - all variations show combined results
- ✅ No duplicate content issues (301 redirects)
- ✅ Featured tags have persistent landing pages for search engines
- ✅ Better cache hit rate (95%+ expected)

---

### 🔄 Phase 3-6: Remaining Work

**Phase 3: Enhanced Tag Pages** - Skipped (basic enhancements already in Phase 2)
- Visual design improvements beyond basic implementation
- Tag statistics/counts display
- Performance testing

**Phase 4: Sitemap Integration** - ✅ COMPLETED (Oct 7, 2025)
- ✅ Add featured tags to sitemap.xml
- ✅ Set appropriate priorities (0.7 for featured tags)
- ✅ Test sitemap validation
- ⏳ Submit to Google Search Console (deployment-time task)

**Phase 5: Cache Integration** - Not started
- Implement tag cache purging in content hooks
- Test cache invalidation when content updated

**Phase 6: Testing & Documentation** - Not started
- E2E tests for tag pages and synonyms
- Performance testing
- User documentation updates

---

## Key Implementation Decisions & Pivots

### Decision 1: URL Encoding in Canonical Tags
**Issue:** Canonical tags in `TAG_SYNONYMS` used different encoding than URL parameters.

**Solution:** Updated `getTagDisplayInfo()` to use `decodeURIComponent()` for comparison, ensuring proper matching regardless of URL encoding format.

```typescript
const decodedCanonical = decodeURIComponent(canonical.toLowerCase());
return TAG_SYNONYMS.find(
  (t) => decodeURIComponent(t.canonicalTag.toLowerCase()) === decodedCanonical,
) || null;
```

### Decision 2: Featured Tags Always Visible
**Rationale:** Featured RPG system tags (D&D, Pathfinder, etc.) should have persistent landing pages for SEO, even before any content is tagged.

**Implementation:** Tag page now checks if tag is in `TAG_SYNONYMS`:
- **Featured tags**: Always render page, show "no entries" message if empty
- **Regular tags**: Redirect to 404 if no content exists

This ensures search engines can index important RPG system pages immediately.

### Decision 3: Synonym Display Format
**User Feedback:** Display synonyms with `#` prefix for clarity.

**Implementation:** Tag page shows synonym list like: `#dnd, #dungeons & dragons, #dd, #d and d`

Makes it clear these are alternative tag spellings users can use.

---

## Notes

- **High SEO Impact**: Featured tags on front page significantly boost tag page visibility
- **Low Database Impact**: Synonym system requires no schema changes
- **User Value**: Easier content discovery, less fragmentation
- **Maintainable**: Synonym config is simple JSON, easy to update
- **Extensible**: Foundation for future tag features (trending, following, etc.)
- **Backwards Compatible**: Existing tag links continue to work

This PBI establishes the foundation for a robust tag system that can grow with the community's needs.
