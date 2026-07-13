# PBI-024: SEO Optimization and Public Page Documentation

**Status:** � In Progress - Phase 1 Complete  
**Priority:** High  
**Estimated Effort:** 1 sprint (1-2 weeks)  
**Phase 1 Completed:** October 4, 2025

**User Story:** As a content creator and site operator, I want all public-facing pages to have proper SEO metadata (descriptions, Open Graph tags, canonical URLs) and proper indexing controls, so that our content is discoverable in search engines while keeping private/admin pages hidden, and I want comprehensive documentation of our public page structure for maintainability.

---

## Implementation Progress

### ✅ Phase 1: Public Page Tree Documentation (COMPLETED - Oct 4, 2025)

### 🔄 Phase 2: SEO Metadata Audit & Fixes (IN PROGRESS - Started Oct 8, 2025)

**Deliverables:**
- ✅ Created comprehensive documentation: `src/docs/77-public-pages-seo.md` (600+ lines)
- ✅ Documented all primary public pages (high SEO priority)
  - Front page, channels, threads, sites, library, tags, docs
  - Current status assessment for each page
  - Specific recommendations for improvements
- ✅ Documented secondary public pages (medium SEO priority)
  - User profiles, search, login, EULA, error pages
  - SEO considerations for each page type
- ✅ Comprehensive list of non-indexable pages (~40+ routes)
  - Admin section (all routes)
  - User settings & authentication
  - Content creation workflows
  - Site management tools
  - Editing & deletion pages
- ✅ SEO best practices section
  - Description guidelines (150-160 chars)
  - Title formatting conventions
  - Image requirements (Open Graph)
  - Snippet utility usage patterns
- ✅ Page hierarchy tree visualization with status indicators
- ✅ Implementation checklists organized by priority
- ✅ robots.txt configuration recommendations
- ✅ Testing & verification guidelines

**Key Findings:**
1. **Critical SEO Gaps Identified:**
   - Front page (/) missing description entirely - highest traffic page ✅ Fixed Oct 4, 2025
   - Sites index (/sites) missing description - major navigation
   - Tag pages (/tags/[tag]) using generic description ✅ Fixed Oct 8, 2025 (PBI-27)
   - Profile pages (/profiles/[uid]) missing dynamic descriptions ✅ Fixed Oct 8, 2025
   
2. **Localization Strategy Defined:**
   - Recommend i18n for all static SEO content (consistency with existing patterns)
   - Primary language: Finnish (fi-FI) for better Google rankings in Finland
   - Create dedicated `seo` namespace in i18n files
   - Use `createPlainSnippet()` for user-generated dynamic content
   - Hybrid approach for pages with optional user content (fallback to i18n)
   
3. **Indexing Control Audit Needed:**
   - 4 pages confirmed with noSharing (settings, create character, keeper, admin channels)
   - 36+ routes need verification for noSharing implementation
   - All admin/* routes must be verified
   - All create/* and edit/delete routes need checking

4. **Quality Issues:**
   - Channel descriptions may exceed recommended length
   - Site/wiki pages lack page-specific descriptions
   - Dynamic content pages need i18n fallback descriptions
   - Some i18n descriptions need SEO review

5. **Already Optimized:**
   - Thread pages (/threads/[threadKey]) properly using createPlainSnippet() from PBI-023 ✅

6. **Documentation Statistics:**
   - ~15-20 main public routes identified
   - ~40+ private routes requiring noSharing
   - 1 route fully optimized, 3 good, 5-7 need work, 4-5 critical issues
   - Clear priority ranking for Phase 2 implementation
   - Comprehensive i18n examples and patterns documented

**Files Created:**
1. `src/docs/77-public-pages-seo.md` - Complete SEO documentation and audit

**Testing Approach Documented:**
- Manual verification steps (view source, check meta tags)
- Automated E2E test structure for indexing controls
- Google Search Console integration guidelines
- robots.txt configuration

### 🔄 Phase 2: SEO Metadata Audit & Fixes (IN PROGRESS - Started Oct 8, 2025)

**Deliverables:**
- ✅ Enhanced ModalPage layout to always block indexing (Oct 9, 2025)
  - **BREAKING CHANGE**: ModalPages now ALWAYS use noSharing={true}
  - Removed noSharing prop from ModalPage interface (redundant)
  - ModalPages are popup-like authenticated interfaces, never indexable
- ✅ Added robots meta tag to EditorHead for all editor pages (Oct 8, 2025)
- ✅ Implemented site.hidden SEO control for public site pages (Oct 8, 2025)
  - Site homepage: noSharing={site.hidden}
  - Site wiki pages: noSharing={site.hidden}
  - Site characters: noSharing={site.hidden}
  - Site TOC: noSharing={site.hidden}
- ✅ Added noSharing={true} to all site management pages (Oct 8, 2025)
  - settings, options, import, members, data
  - assets (index and individual)
  - clocks, handouts
  - create/* (page, handout, clock)
  - toc/settings
  - [pageKey]/edit, delete, history
- 🔄 Sites SEO improvements in progress

**Key Findings:**

1. **Site Hidden Field Implementation:**
   - Sites have a `hidden` boolean field in the schema (default: true for new sites)
   - API endpoint `/api/sites` filters by `hidden: false` to show only public sites
   - Public site pages now respect this field with `noSharing={site.hidden}`
   - This prevents search engines from indexing private campaign sites

2. **Layout Enhancements:**
   - **ModalPage**: Now ALWAYS blocks indexing (noSharing={true} hardcoded)
     - ModalPages are popup-like authenticated interfaces, similar to EditorPage
     - Removed redundant noSharing prop from interface
     - All modal pages are now consistently non-indexable
   - **EditorHead**: Automatically adds robots noindex tag (all editors are private)
   - **BaseHead**: Already properly handles noSharing prop

3. **Site-Related Pages Indexing Control:**
   - **Public pages** (conditional on site.hidden):
     - `/sites/[siteKey]` - Site homepage
     - `/sites/[siteKey]/[pageKey]` - Wiki pages
     - `/sites/[siteKey]/characters` - Character listing
     - `/sites/[siteKey]/toc` - Table of contents
   - **Private pages** (always blocked via ModalPage or EditorHead):
     - All ModalPage routes automatically non-indexable
     - All EditorPage routes automatically non-indexable
     - No need to manually specify noSharing on these pages

4. **Sites Index SEO:**
   - `/sites` already has proper i18n description from PBI-026
   - Uses seo:sites.title and seo:sites.description
   - Cache headers properly configured for performance

**Files Modified:**
1. `src/layouts/ModalPage.astro` - Added noSharing, description, image props
2. `src/components/server/BaseHead/EditorHead.astro` - Added robots noindex meta tag
3. `src/pages/sites/[siteKey]/index.astro` - Added noSharing={site.hidden}
4. `src/pages/sites/[siteKey]/[pageKey]/index.astro` - Added noSharing={site.hidden}
5. `src/pages/sites/[siteKey]/characters.astro` - Added noSharing={site.hidden}
6. `src/pages/sites/[siteKey]/toc/index.astro` - Added noSharing={site.hidden}
7. Site management pages (11 files) - Added noSharing={true}

**SEO Best Practice Applied:**
- **Layout-level enforcement**: ModalPage and EditorPage layouts enforce noSharing automatically
- **Principle**: Popup-like authenticated interfaces should never be indexed, similar to admin panels
- Hidden sites (private campaigns) are not indexed by search engines
- Public sites are discoverable and indexable
- All site management/editing interfaces are blocked from indexing via layout enforcement
- Consistent implementation: public content is indexable, tools/admin/modals are not

### 🔄 Phase 2: SEO Metadata Audit & Fixes (NOT STARTED)

## Problem Statement

Currently, the application lacks:

1. **Systematic SEO Documentation**: No centralized documentation of public pages, their purposes, and SEO requirements
2. **Inconsistent Meta Descriptions**: Many public pages lack proper `description` props or use generic descriptions
3. **Missing Indexing Controls**: Some private/admin routes may not properly use `noSharing` prop to prevent indexing
4. **No SEO Audit Trail**: No easy way to verify which pages are indexed vs. which should be hidden
5. **Inconsistent Snippet Usage**: After PBI-023, we need to ensure all pages use proper snippet generation for meta descriptions

### Current Issues

**Missing/Poor Descriptions:**
- Several public pages use layout without `description` prop
- Some pages have technical descriptions instead of user-friendly SEO copy
- No consistent length (Google recommends 150-160 characters)

**Indexing Control Gaps:**
- Admin pages may lack `noSharing={true}`
- User settings and authentication pages need verification
- Character keeper and other private tools need indexing prevention

**Documentation Gap:**
- No single source of truth for public page hierarchy
- Unclear which pages should be indexed
- No SEO guidelines for new pages

---

## Proposed Solution

Create a three-phase approach:

### Phase 1: Public Page Tree Documentation
Create comprehensive documentation of all public-facing pages, their purposes, and SEO requirements.

### Phase 2: SEO Metadata Audit & Fixes
Systematically review and fix all public pages to ensure proper SEO metadata using `createPlainSnippet()` where applicable.

### Phase 3: Indexing Control Verification
Ensure all private, admin, and authenticated pages properly use `noSharing` to prevent search engine indexing.

---

## Phase 1: Public Page Tree Documentation

### Deliverables

**New Documentation File:** `src/docs/77-public-pages-seo.md`

This document should include:

1. **Public Page Hierarchy Tree**
   - Visual tree structure of all indexable pages
   - Route paths and page titles
   - Short descriptions of page content/purpose
   - SEO priority (High/Medium/Low)

2. **SEO Guidelines**
   - Description length recommendations (150-160 chars)
   - Title format conventions
   - Open Graph image requirements
   - Keyword usage patterns

3. **Indexable vs. Non-Indexable Pages**
   - Clear categorization
   - Reasons for indexing decisions
   - noSharing usage documentation

4. **Snippet Usage Guidelines**
   - When to use `createPlainSnippet()` for descriptions
   - When to use `createRichSnippet()` for content previews
   - Default length parameters for different page types

### Public Page Categories

**Primary Public Pages (High SEO Priority):**
```
/                           - Front page (thread listing)
/channels                   - Channel directory
/channels/[channel]         - Individual channel thread listings
/threads/[threadKey]        - Individual thread discussions
/sites                      - Site/wiki directory
/sites/[siteKey]            - Individual site home
/sites/[siteKey]/[pageKey]  - Site wiki pages
/tags/[tag]                 - Tag-based thread listings
/docs/[id]                  - Documentation pages
```

**Secondary Public Pages (Medium SEO Priority):**
```
/profiles/[uid]             - User profiles (public)
/login                      - Login page (low priority, but public)
/eula                       - End User License Agreement
/search                     - Search page (indexable but no unique content)
```

**Non-Indexable Pages (noSharing=true Required):**
```
/admin/*                    - All admin pages
/library/*                  - User library (authenticated only)
/settings                   - User settings
/create-profile             - Profile creation
/onboarding                 - User onboarding
/create/*                   - Content creation pages
/sites/[siteKey]/keeper     - Character keeper (private tool)
/sites/[siteKey]/settings   - Site settings
/sites/[siteKey]/options    - Site options
/sites/[siteKey]/import     - Import tools
/sites/[siteKey]/data       - Data export
/sites/[siteKey]/members    - Member management
/sites/[siteKey]/clocks     - Private clocks
/sites/[siteKey]/assets     - Asset management
/sites/[siteKey]/handouts   - Private handouts
/characters/[key]/edit      - Character editing
/characters/[key]/delete    - Character deletion
/threads/[key]/confirmDelete - Thread deletion
/threads/[key]/replies/*/delete - Reply deletion
/threads/[key]/replies/*/fork   - Reply forking
/403                        - Access forbidden
/404                        - Not found
/logout                     - Logout page
/offline.html               - Offline fallback
```

### Documentation Structure

```markdown
# Public Pages and SEO Structure

## Overview
This document describes the public-facing page structure of Pelilauta, including SEO requirements and indexing controls.

## Primary Public Pages

### Front Page (/)
- **Purpose**: Main entry point, shows latest threads
- **SEO Description**: "Pelilauta - Role-playing game community for discussions, wikis, and character management"
- **Priority**: Highest
- **Indexing**: Yes
- **Current Implementation**: [Status and findings]

### Thread Pages (/threads/[threadKey])
- **Purpose**: Individual discussion threads
- **SEO Description**: Dynamic - uses createPlainSnippet(markdownContent, 160)
- **Priority**: High
- **Indexing**: Yes
- **Current Implementation**: ✅ Proper description with snippet utility

[Continue for all page types...]

## Non-Indexable Pages

### Admin Section (/admin/*)
- **Purpose**: Administrative tools and management
- **Indexing**: No (noSharing=true)
- **Current Implementation**: [Audit findings]

[Continue for all non-indexable routes...]

## SEO Best Practices

### Description Guidelines
- Length: 150-160 characters
- Use active voice
- Include primary keywords naturally
- Avoid duplicate descriptions
- Use createPlainSnippet() for dynamic content

### Title Guidelines
- Format: "[Page Title] - Pelilauta" or "[Page Title] | Pelilauta"
- Keep under 60 characters
- Use descriptive, unique titles

### Image Guidelines
- Default: Site logo/banner
- Dynamic: Use thread/site images when available
- Size: 1200x630px (Open Graph standard)
```

---

## Phase 2: SEO Metadata Audit & Fixes

### Prerequisites

**Create i18n SEO Namespace:**
Before implementing page fixes, create a centralized i18n file for all static SEO content:

```typescript
// src/locales/fi/seo.ts
export default {
  frontPage: {
    title: 'Pelilauta - Roolipelaamisen yhteisö',
    description: 'Suomalainen roolipelaamisen yhteisö. Keskustele peleistä, jaa kampanjawikejä ja hallinnoi hahmojasi. Liity tuhansien pelaajien joukkoon!',
  },
  sites: {
    title: 'Sivustot, pelit ja kampajat',
    description: 'Selaa yhteisön kampanjawikejä ja pelisivustoja. Luo ja jaa omia roolipelien maailmoja, NPC:itä, sijainteja ja peliresursseja.',
    fallback: '{{name}} - Roolipelin kampanjasivusto Pelilaudalla',
  },
  tag: {
    description: 'Keskustelut aiheesta #{{tag}}. Tutustu yhteisön keskusteluihin ja jaa omia ajatuksiasi Pelilaudan roolipelifoorumilla.',
  },
  profile: {
    fallback: '{{nick}} - Pelilaudan yhteisön jäsen ja roolipelien harrastaja',
  },
  search: {
    title: 'Haku',
    description: 'Hae Pelilaudan sisällöstä: keskustelut, kampanjasivustot ja roolipeliresurssit. Löydä vastaukset kysymyksiisi.',
  },
  login: {
    description: 'Kirjaudu Pelilautaan keskustellaksesi, luodaksesi sivustoja ja hallitaksesi hahmojasi.',
  },
  eula: {
    description: 'Pelilauta käyttöehdot ja käyttöoikeussopimus. Tutustu ehtoihin ennen palvelun käyttöä.',
  },
  error404: {
    description: 'Etsimääsi sivua ei löydy. Palaa Pelilaudan etusivulle selailemaan keskusteluja ja kampanjasivustoja.',
  },
};
```

**Why i18n for SEO?**
- ✅ **Consistency**: Matches existing i18n patterns in the codebase
- ✅ **Maintainability**: All SEO text centralized in one place
- ✅ **Future-proof**: Ready for internationalization (en/fi/etc)
- ✅ **Language matching**: Finnish descriptions for Finnish site = better Google rankings
- ✅ **Team collaboration**: Non-technical team members can edit SEO text easily

### Audit Process

1. **Create Audit Spreadsheet/Checklist**
   - List all public pages
   - Current description status
   - Recommended improvements
   - Priority ranking

2. **Review Each Public Page**
   - Check for `description` prop
   - Verify description quality and length
   - Ensure proper title formatting
   - Check Open Graph image usage
   - Verify snippet utility usage where applicable

3. **Fix Missing/Poor Descriptions**
   - Add descriptions to pages missing them
   - Improve generic descriptions
   - Standardize description length (150-160 chars)
   - Use `createPlainSnippet()` for dynamic content

### Pages Requiring Attention

**Front Page (index.astro):**
```astro
// Current: Missing description
// Proposed: Use i18n
import { t } from '@utils/i18n';

<Page 
  title={t('seo:frontPage.title')}
  description={t('seo:frontPage.description')}
  search
>
```

**Channel Pages (channels/[channel].astro):**
```astro
// Current: Uses channel.description (good)
// Verify: Description length is appropriate (150-160 chars)
// Consider: Truncate long descriptions with createPlainSnippet()
const description = channel.description.length > 160
  ? createPlainSnippet(channel.description, 160)
  : channel.description;
```

**Site List (sites/index.astro):**
```astro
// Current: Missing description
// Proposed: Use i18n
import { t } from '@utils/i18n';

<Page 
  title={t('seo:sites.title')}
  description={t('seo:sites.description')}
>
```

**Character Library (library/characters.astro):**
```astro
// Current: Has description from i18n (verify quality)
// Review: Ensure seo:library.description is SEO-optimized
const description = t('seo:library.description');
```

**Documentation Pages (docs/[id].astro):**
```astro
// Dynamic descriptions based on document content
// Use createPlainSnippet() for document preview
const description = doc.description || 
  createPlainSnippet(doc.content, 160);
```

**Tag Pages (tags/[tag].astro):**
```astro
// Current: "A list of threads with this tag" (too generic)
// Proposed: Use i18n template
import { t } from '@utils/i18n';

const description = t('seo:tag.description', { tag });
// i18n: "Keskustelut aiheesta #{{tag}}. Tutustu yhteisön keskusteluihin..."
```

**Profile Pages (profiles/[uid].astro):**
```astro
// Dynamic descriptions based on user bio with i18n fallback
import { createPlainSnippet } from '@utils/snippetHelpers';
import { t } from '@utils/i18n';

const description = profile.bio?.trim()
  ? createPlainSnippet(profile.bio, 160)
  : t('seo:profile.fallback', { nick: profile.nick });
```

### Implementation Checklist

- [x] **Create i18n SEO file** (`src/locales/fi/seo.ts`) with all static descriptions ✅ Oct 4, 2025
- [ ] **Audit all public pages** (create spreadsheet with findings)
- [x] **Front page**: Add i18n description ✅ Oct 4, 2025
- [x] **Channel index**: Add i18n description ✅ Oct 4, 2025
- [x] **Channel pages**: Verify description quality, truncate if needed ✅ Oct 4, 2025
- [x] **Thread pages**: Verified PBI-023 implementation working, improved title ✅ Oct 4, 2025
- [x] **Tag pages**: Add i18n template description ✅ Oct 8, 2025 (completed in PBI-27)
- [x] **Site list**: Add i18n description ✅ Oct 8, 2025 (already in PBI-026)
- [x] **Site pages**: Implement site.hidden SEO control ✅ Oct 8, 2025
- [ ] **Site wiki pages**: Verify page descriptions with i18n fallback
- [x] **Profile pages**: Add dynamic descriptions using user bio with i18n fallback ✅ Oct 8, 2025
- [ ] **Documentation pages**: Add/improve descriptions
- [ ] **Login page**: Add i18n description
- [ ] **EULA page**: Add i18n description
- [ ] **Search page**: Add i18n description
- [ ] **404/403 pages**: Add i18n descriptions
- [ ] **Update existing i18n files** if they have SEO content in other namespaces

### SEO Enhancement Examples

```astro
---
// Example 1: Static description with i18n (RECOMMENDED)
import Page from '@layouts/Page.astro';
import { t } from '@utils/i18n';

const title = t('seo:frontPage.title');
const description = t('seo:frontPage.description');
---

<Page {title} {description}>
  <!-- Page content -->
</Page>
```

```astro
---
// Example 2: Dynamic description using snippet utility
import Page from '@layouts/Page.astro';
import { createPlainSnippet } from '@utils/snippetHelpers';
import { t } from '@utils/i18n';

const site = await getSite(siteKey);
const description = site.description 
  ? createPlainSnippet(site.description, 160)
  : t('seo:site.fallback', { name: site.name });
---

<Page title={site.name} {description}>
  <!-- Page content -->
</Page>
```

```astro
---
// Example 3: Hybrid approach for tag pages
import Page from '@layouts/Page.astro';
import { t } from '@utils/i18n';

const description = t('seo:tag.description', { tag });
// i18n template: "Keskustelut aiheesta #${tag}. Tutustu yhteisön keskusteluihin Pelilaudan roolipelifoorumilla."
---

<Page title={`#${tag} - Pelilauta`} {description}>
  <!-- Page content -->
</Page>
```

```astro
---
// Example 4: User-generated content with i18n fallback
import Page from '@layouts/Page.astro';
import { createPlainSnippet } from '@utils/snippetHelpers';
import { t } from '@utils/i18n';

const user = await getProfile(uid);
const description = user.bio?.trim()
  ? createPlainSnippet(user.bio, 160)
  : t('seo:profile.fallback', { nick: user.nick });
---

<Page title={user.nick} {description}>
  <!-- Page content -->
</Page>
```

---

## Phase 3: Indexing Control Verification

### Site-Related Pages Status

**Public Site Pages (conditional indexing based on site.hidden):**
- [x] `/sites/[siteKey]/index.astro` - Site homepage ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/[pageKey]/index.astro` - Wiki pages ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/characters.astro` - Character listing ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/toc/index.astro` - Table of contents ✅ Oct 8, 2025

**Private Site Management Pages (always noSharing={true}):**
- [x] All site management pages verified ✅ Oct 8, 2025
- [x] All creation workflows verified ✅ Oct 8, 2025
- [x] All editing/deletion pages verified ✅ Oct 8, 2025
- [x] EditorHead auto-blocks all editor pages ✅ Oct 8, 2025

### Audit Process

1. **Identify All Non-Public Routes**
   - Admin pages
   - Settings pages
   - Creation workflows
   - Authentication pages
   - Private tools

2. **Verify noSharing Implementation**
   - Check each page for `noSharing` prop
   - Verify BaseHead properly adds `noindex, nofollow`
   - Test with Google Search Console

3. **Fix Missing Indexing Controls**
   - Add `noSharing={true}` to all private pages
   - Verify robots.txt configuration
   - Check sitemap excludes private routes

### Non-Indexable Routes Checklist

**Admin Routes:**
- [ ] `/admin/index.astro` - noSharing verification
- [ ] `/admin/channels.astro` - noSharing verification
- [ ] `/admin/channels/add.astro` - noSharing verification
- [ ] `/admin/messaging.astro` - noSharing verification
- [ ] `/admin/sites.astro` - noSharing verification
- [ ] `/admin/users.astro` - noSharing verification
- [ ] `/admin/sheets/*.astro` - noSharing verification

**User Settings & Auth:**
- [ ] `/settings.astro` - noSharing verification ✅
- [ ] `/create-profile.astro` - noSharing verification
- [ ] `/onboarding.astro` - noSharing verification
- [ ] `/logout.astro` - noSharing verification
- [ ] `/403.astro` - noSharing verification ✅
- [ ] `/404.astro` - noSharing consideration (may be indexable for SEO)

**User Library (Authenticated Only):**
- [x] `/library/characters.astro` - noSharing verification ✅ Oct 8, 2025

**Content Creation:**
- [ ] `/create/thread.astro` - noSharing verification
- [ ] `/create/site.astro` - noSharing verification
- [ ] `/create/character.astro` - noSharing verification ✅

**Site Management:**
- [x] `/sites/[siteKey]/keeper.astro` - noSharing verification ✅ (already implemented)
- [x] `/sites/[siteKey]/settings.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/options.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/import.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/data.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/members.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/clocks.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/assets/*.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/handouts/*.astro` - noSharing verification ✅ (already implemented)
- [x] `/sites/[siteKey]/create/*.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/[pageKey]/edit.astro` - noSharing verification ✅ Oct 8, 2025 (EditorHead)
- [x] `/sites/[siteKey]/[pageKey]/delete.astro` - noSharing verification ✅ Oct 8, 2025
- [x] `/sites/[siteKey]/[pageKey]/history.astro` - noSharing consideration ✅ Oct 8, 2025 (noSharing={true})

**Character Management:**
- [ ] `/characters/[key]/edit.astro` - noSharing verification
- [ ] `/characters/[key]/delete.astro` - noSharing verification

**Thread Management:**
- [ ] `/threads/[key]/confirmDelete.astro` - noSharing verification
- [ ] `/threads/[key]/replies/[replyKey]/delete.astro` - noSharing verification
- [ ] `/threads/[key]/replies/[replyKey]/fork.astro` - noSharing verification

### Verification Methods

**1. Code Review:**
```typescript
// Verify BaseHead implementation
{noSharing && <meta name="robots" content="noindex, nofollow" />}
```

**2. Manual Testing:**
- Load each private page
- Check HTML source for robots meta tag
- Verify tag shows: `<meta name="robots" content="noindex, nofollow" />`

**3. Automated Test:**
Create E2E test to verify noSharing pages:
```typescript
test('private pages should not be indexable', async ({ page }) => {
  const privateRoutes = [
    '/admin',
    '/settings',
    '/create/thread',
    // ... more routes
  ];
  
  for (const route of privateRoutes) {
    await page.goto(route);
    const robotsMeta = await page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
  }
});
```

**4. robots.txt Review:**
Ensure robots.txt properly disallows private sections:
```txt
User-agent: *
Disallow: /admin/
Disallow: /settings
Disallow: /create/
Disallow: /*/edit
Disallow: /*/delete
Disallow: /*/settings
Disallow: /*/options
Disallow: /*/import
Disallow: /*/data
Disallow: /*/keeper
```

---

## Acceptance Criteria

### Phase 1: Documentation
- [ ] Created `src/docs/77-public-pages-seo.md`
- [ ] Documented all public page routes with purposes
- [ ] Categorized indexable vs. non-indexable pages
- [ ] Included SEO best practices and guidelines
- [ ] Added snippet utility usage recommendations
- [ ] Created page tree hierarchy visualization
- [ ] Documented current implementation status

### Phase 2: SEO Metadata
- [ ] Audited all public pages for SEO metadata
- [ ] All public pages have descriptions (150-160 chars)
- [ ] Descriptions are user-friendly and SEO-optimized
- [ ] Dynamic content uses `createPlainSnippet()` appropriately
- [ ] All page titles follow consistent format
- [ ] Open Graph images properly configured
- [ ] No duplicate or generic descriptions remain
- [ ] Meta descriptions tested in Google Search Console

### Phase 3: Indexing Control
- [ ] All admin pages use `noSharing={true}`
- [ ] All settings/auth pages use `noSharing={true}`
- [ ] All creation workflows use `noSharing={true}`
- [ ] All editing/deletion pages use `noSharing={true}`
- [ ] All private tools use `noSharing={true}`
- [ ] robots.txt properly configured
- [ ] E2E tests verify noSharing implementation
- [ ] Manual verification completed
- [ ] Google Search Console shows no indexed private pages

### Testing & Validation
- [ ] All pages render with proper meta tags
- [ ] No TypeScript or linting errors
- [ ] E2E test suite includes indexing verification
- [ ] Manual SEO audit shows improvements
- [ ] Google Search Console configured and monitored

### Documentation
- [ ] Public page documentation complete
- [ ] SEO guidelines documented
- [ ] Implementation notes added to relevant pages
- [ ] PBI marked as complete

---

## Technical Implementation Notes

### Using createPlainSnippet() for Dynamic Descriptions

```astro
---
import { createPlainSnippet } from '@utils/snippetHelpers';

// For markdown content
const description = createPlainSnippet(content.markdownContent, 160);

// With fallback
const description = content.description
  ? createPlainSnippet(content.description, 160)
  : 'Default fallback description';

// For user-generated content with safety
const description = user.bio?.trim()
  ? createPlainSnippet(user.bio, 160)
  : `${user.nick} - Pelilauta community member`;
---

<Page title={title} {description}>
```

### Ensuring noSharing Prop

```astro
---
// For all private/admin pages
import ModalPage from '@layouts/ModalPage.astro';
---

<ModalPage title="Admin Dashboard" noSharing={true}>
  <!-- Private content -->
</ModalPage>
```

### robots.txt Configuration

Ensure `/public/robots.txt` includes:
```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /settings
Disallow: /create/
Disallow: /onboarding
Disallow: /*/edit
Disallow: /*/delete
Disallow: /*/settings
Disallow: /*/options
Disallow: /*/import
Disallow: /*/data
Disallow: /*/keeper
Disallow: /*/members
Disallow: /*/assets
Disallow: /api/

Sitemap: https://pelilauta.org/sitemap.xml
```

---

## Dependencies

- **PBI-023**: Snippet utility implementation (prerequisite - completed ✅)
- **marked**: For rendering markdown in dynamic descriptions (already available)
- **Google Search Console**: For SEO verification and monitoring
- **Astro layouts**: Existing layout system with `noSharing` prop support

---

## Out of Scope (Future Enhancements)

- **Automated Sitemap Generation**: Dynamic sitemap.xml generation
- **Structured Data/Schema.org**: Rich snippets with JSON-LD
- **Open Graph Image Generation**: Dynamic OG image creation
- **Multi-language SEO**: Hreflang tags for i18n
- **SEO Monitoring Dashboard**: Automated SEO health checks
- **Search Console Integration**: Automated reporting
- **Page Speed Optimization**: Separate performance PBI
- **Social Media Cards**: Enhanced preview cards beyond basic OG tags

---

## Migration Strategy

### Week 1: Documentation & Audit
1. Create public pages documentation
2. Audit all pages for SEO metadata
3. Create prioritized fix list
4. Document current state

### Week 2: Implementation
1. Fix high-priority public pages (front, channels, threads, sites)
2. Verify and fix noSharing on admin pages
3. Add missing descriptions to public pages
4. Update robots.txt if needed

### Week 3: Verification & Testing
1. Create E2E tests for indexing controls
2. Manual verification of all changes
3. Google Search Console configuration
4. Monitor indexing changes
5. Final documentation updates

---

## Success Metrics

- **SEO Coverage**: 100% of public pages have quality descriptions
- **Indexing Control**: 100% of private pages use noSharing
- **Description Quality**: All descriptions 150-160 characters
- **Search Visibility**: Improved search console impressions (monitor post-deployment)
- **Documentation**: Complete public page tree documentation
- **Testing**: E2E tests verify indexing controls
- **Zero Regressions**: No public pages accidentally de-indexed

---

## Related PBIs

- **PBI-023**: Robust Markdown Snippet Utility (prerequisite - completed)
- **Future PBI**: Structured Data Implementation (schema.org/JSON-LD)
- **Future PBI**: Automated Sitemap Generation
- **Future PBI**: Performance Optimization (Core Web Vitals)

---

## Notes

- This PBI focuses on SEO fundamentals and indexing control
- Advanced features (structured data, dynamic sitemaps) are intentionally out of scope
- Success depends on completing PBI-023 first for proper snippet generation
- Google Search Console should be monitored after changes to verify indexing
- Consider creating automated SEO health check tools in future iterations
