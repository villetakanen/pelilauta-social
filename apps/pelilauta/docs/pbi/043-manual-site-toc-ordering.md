# PBI-043: Manual Site Table of Contents Ordering

**Priority:** Medium  
**Type:** Feature Enhancement  
**Estimated Effort:** 8-12 hours  

**User Stories:**
- As a site owner, I want to manually order the site index and table of contents, so that I can present pages in a custom sequence that makes sense for my content.
- As a site owner, I want to drag and drop TOC links to reorder them, so that I can easily reorganize my site structure without editing metadata.

## Terminology

- **TOC (Table of Contents)**: The page listing displayed at `/sites/{siteKey}/toc/`
- **Site Index**: The list of pages stored in `site.pageRefs[]` array in Firestore
- **Sort Order**: The `site.sortOrder` field that controls how pages are ordered (`name`, `createdAt`, `flowTime`, `manual`)
- **Page Refs**: The `PageRef[]` array containing page metadata for the TOC

---

## Problem Statement

Currently, site pages can only be automatically sorted by predefined criteria (name, creation date, or last updated time). This creates limitations for site owners who want to present content in a specific narrative or logical order:

1. **No Custom Sequencing**: Cannot arrange pages in a specific learning path or story order
2. **Limited Organization**: Alphabetical/chronological sorting doesn't reflect content relationships
3. **No Priority Control**: Cannot highlight important pages by positioning them first
4. **Category Limitations**: Within categories, ordering is still automatic
5. **Documentation Flow**: Technical documentation requires specific ordering (Introduction → Basics → Advanced)

### Current Behavior

**Sort Order Options:**
```typescript
// src/schemas/SiteSchema.ts
export const SiteSortOrderSchema = z.enum([
  'name',       // Alphabetical by page name
  'createdAt',  // Oldest first
  'flowTime',   // Most recently updated first
  'manual',     // ⚠️ Exists but not implemented
]);
```

**Current TOC Rendering:**
```typescript
// src/components/server/SiteApp/SiteTocApp.astro
const sortBy = site.sortOrder || 'name';

for (const category of categories) {
  const pagesInCategory = site.pageRefs?.filter(/* ... */);
  
  // Automatic sorting only
  if (sortBy === 'name') {
    pagesInCategory?.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'flowTime') {
    pagesInCategory?.sort((a, b) => (a.flowTime || 0) - (b.flowTime || 0));
  }
  // 'manual' option exists but does nothing
}
```

**Problem:** When `sortOrder: 'manual'` is selected:
1. No UI exists to define the manual order
2. Pages are displayed in Firestore array order (effectively random)
3. No drag-and-drop interface to reorder pages
4. No persistence of the custom order

### Example Scenario

**Campaign Site - Desired Manual Order:**
1. **Session 0: Character Creation**
2. **Session 1: The Adventure Begins**
3. **Session 5: The Boss Fight** ← User wants this prominently placed
4. **Session 2: The Journey Continues**
5. **Session 3: Into the Dungeon**
6. **Session 4: Puzzles and Traps**

**Current Problem:**
- Alphabetical: "Session 0", "Session 1", "Session 2", ... (boring, no emphasis)
- Chronological: Order by creation date (doesn't allow narrative restructuring)
- By flowTime: Most recently edited first (doesn't reflect story importance)

**With Manual Ordering:**
- Owner can drag Session 5 to position 3 to highlight it
- Can reorder sessions to create a narrative flow
- Can group related content regardless of naming/dates

### Visual Examples

**Before (Current System):**
```
TOC Settings:
┌─────────────────────────────────────┐
│ Sort Order: [Name ▼]                │
│ Options:    Name / Created / Updated│
└─────────────────────────────────────┘

TOC Display (Alphabetical):
• Character Sheet Template
• Introduction to Campaign
• Session 1
• Session 2
• World Map
```

**After (With Manual Ordering):**
```
TOC Settings:
┌─────────────────────────────────────┐
│ Sort Order: [Manual ▼]              │
│ Options:    Name / Created / Updated│
│             / Manual                │
└─────────────────────────────────────┘

TOC Display (Manual - Draggable):
┌─────────────────────────────────────┐
│ ☰ Introduction to Campaign          │
│ ☰ Character Sheet Template          │
│ ☰ Session 1                         │
│ ☰ Session 2                         │
│ ☰ World Map                         │
└─────────────────────────────────────┘
      ↑ Drag handles appear
```

**Admin TOC Tool UI:**
```
┌───────────────────────────────────────────┐
│ Table of Contents Settings                │
├───────────────────────────────────────────┤
│ Sort Order: [Manual ▼]                    │
│                                           │
│ Category: Introduction                    │
│ ┌───────────────────────────────────────┐ │
│ │ ☰ Welcome Page                        │ │
│ │ ☰ Getting Started                     │ │
│ │ ☰ Rules & Guidelines                  │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ Category: Sessions                        │
│ ┌───────────────────────────────────────┐ │
│ │ ☰ Session 1: The Beginning           │ │
│ │ ☰ Session 3: Into the Dungeon        │ │ ← Can drag here
│ │ ☰ Session 2: The Journey             │ │ ← Out of order!
│ └───────────────────────────────────────┘ │
│                                           │
│ [Save Order]                              │
└───────────────────────────────────────────┘
```

---

## Solution Design

### Schema Changes

**Add `order` field to PageRef:**
```typescript
// src/schemas/SiteSchema.ts
export const PageRefSchema = z.object({
  key: z.string(),
  name: z.string(),
  author: z.string(),
  category: z.string().optional(),
  flowTime: z.number(),
  order: z.number().optional(), // NEW: Manual sort position
});
```

**No changes needed to SiteSortOrderSchema** - `'manual'` already exists.

### Data Structure

**Firestore Document:**
```json
{
  "key": "my-campaign",
  "name": "My Campaign",
  "sortOrder": "manual",
  "pageRefs": [
    {
      "key": "welcome",
      "name": "Welcome Page",
      "category": "intro",
      "flowTime": 1234567890,
      "order": 0  // First in manual order
    },
    {
      "key": "session-1",
      "name": "Session 1",
      "category": "sessions",
      "flowTime": 1234567900,
      "order": 1  // Second in manual order
    },
    {
      "key": "session-3",
      "name": "Session 3",
      "category": "sessions",
      "flowTime": 1234567920,
      "order": 2  // Third - manually placed before Session 2
    },
    {
      "key": "session-2",
      "name": "Session 2",
      "category": "sessions",
      "flowTime": 1234567910,
      "order": 3  // Fourth - manually placed after Session 3
    }
  ]
}
```

### Component Architecture

**1. TOC Settings Component** (`src/components/svelte/sites/toc/SiteTocTool.svelte`)
- Already has sort order dropdown
- Add "Manual" option to the dropdown (already in schema)
- Show drag-and-drop UI when `sortOrder === 'manual'`

**2. Manual Ordering Component** (NEW: `src/components/svelte/sites/toc/ManualTocOrdering.svelte`)
- Uses `<cn-sortable-list>` from Cyan Design System
- Renders pages grouped by category
- Allows drag-and-drop reordering within each category
- Saves order to Firestore via API

**3. TOC Display Component** (`src/components/server/SiteApp/SiteTocApp.astro`)
- Add sorting logic for `sortBy === 'manual'`
- Sort by `page.order` field if present
- Fall back to array order if `order` field missing

### User Flow

**Setting Manual Order:**
1. Site owner navigates to `/sites/{siteKey}/toc/settings`
2. Changes "Sort Order" dropdown to "Manual"
3. Manual ordering interface appears with draggable page list
4. Owner drags pages to desired positions
5. "Save Order" button persists changes to Firestore
6. TOC immediately reflects new order

**Viewing Manually Ordered TOC:**
1. User visits `/sites/{siteKey}/toc/`
2. Server renders TOC sorted by `page.order` ascending
3. Pages appear in owner's custom sequence

---

## Implementation Plan

### Phase 1: Schema & Data Layer (2 hours)

**1.1 Update PageRefSchema**
```typescript
// src/schemas/SiteSchema.ts
export const PageRefSchema = z.object({
  // ... existing fields
  order: z.number().optional(), // Manual sort position
});
```

**1.2 Create Update Function (Client-Side)**
```typescript
// src/firebase/client/site/updatePageRefsOrder.ts
import { SITES_COLLECTION_NAME, type PageRef } from 'src/schemas/SiteSchema';

/**
 * Updates the order of page references in a site's table of contents.
 * Uses client-side Firestore update with dynamic imports for code splitting.
 * 
 * @param siteKey - The key of the site to update
 * @param orderedPageRefs - Array of page refs in the desired order
 * @param silent - If true, skips cache purging (default: false)
 */
export async function updatePageRefsOrder(
  siteKey: string,
  orderedPageRefs: PageRef[],
  silent = false,
): Promise<void> {
  if (!siteKey) {
    throw new Error('updatePageRefsOrder: siteKey is required');
  }

  // Dynamic import of firebase/firestore for code splitting
  const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
  const { toFirestoreEntry } = await import('src/utils/client/toFirestoreEntry');
  
  // Add order index to each page ref
  const pageRefsWithOrder = orderedPageRefs.map((ref, index) => ({
    ...ref,
    order: index,
  }));
  
  // Create ref and prep data for update
  const siteDoc = doc(getFirestore(), SITES_COLLECTION_NAME, siteKey);
  const updateData = toFirestoreEntry({ pageRefs: pageRefsWithOrder }, { silent });
  
  // Update the site doc
  const updateResult = updateDoc(siteDoc, updateData);
  
  // Trigger cache purging for the TOC page
  // This is done asynchronously to avoid blocking the update operation
  if (!silent) {
    try {
      const { purgeCacheForSite } = await import('../cache/purgeCacheHelpers');
      await purgeCacheForSite(siteKey);
    } catch (error) {
      // Cache purging failures should not block TOC updates
      const { logDebug } = await import('../../../utils/logHelpers');
      logDebug(
        'updatePageRefsOrder',
        'Cache purging failed but TOC order update succeeded',
        error,
      );
    }
  }
  
  return updateResult;
}
```

**Why Client-Side?**
- Follows existing pattern from `updateSite.ts`
- Firestore security rules already protect write access (site owners only)
- Dynamic imports enable code splitting
- Includes automatic cache purging for TOC pages
- Simpler than creating API endpoint
- Authorization handled at Firestore rules level

### Phase 2: TOC Display Logic (2 hours)

**2.1 Update SiteTocApp Sorting**
```astro
// src/components/server/SiteApp/SiteTocApp.astro
for (const category of categories) {
  const pagesInCategory = site.pageRefs?.filter(/* ... */);
  
  if (sortBy === 'manual') {
    // Sort by order field, fall back to array order
    pagesInCategory?.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  } else if (sortBy === 'name') {
    // ... existing logic
  } else if (sortBy === 'flowTime') {
    // ... existing logic
  }
  
  pages.set(category.slug, pagesInCategory || []);
}
```

**2.2 Update TOC Settings to Include Manual Option**
```typescript
// src/components/svelte/sites/toc/SiteTocTool.svelte
const sortOrderOptions = new Map<string, string>([
  ['name' as SiteSortOrder, t('entries:site.sortOrders.name')],
  ['createdAt' as SiteSortOrder, t('entries:site.sortOrders.createdAt')],
  ['flowTime' as SiteSortOrder, t('entries:site.sortOrders.flowTime')],
  ['manual' as SiteSortOrder, t('entries:site.sortOrders.manual')], // NEW
]);
```

### Phase 3: Drag-and-Drop UI (4 hours)

**3.1 Create ManualTocOrdering Component**
```svelte
// src/components/svelte/sites/toc/ManualTocOrdering.svelte
<script lang="ts">
import type { Site, PageRef, CategoryRef } from '@schemas/SiteSchema';
import { updatePageRefsOrder } from '@firebase/client/site/updatePageRefsOrder';
import { pushSnack } from '@utils/client/snackUtils';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import SvelteSortableList from '../app/SvelteSortableList.svelte';
import type { CnListItem } from '@11thdeg/cyan-lit';

interface Props {
  site: Site;
}
const { site }: Props = $props();

// Group pages by category
const categories = $state([...(site.pageCategories || [])]);
const pagesByCategory = $derived.by(() => {
  const result = new Map<string, PageRef[]>();
  
  for (const category of categories) {
    const pagesInCat = site.pageRefs?.filter(
      (page) => page.category === category.slug
    ) || [];
    
    // Sort by order field for initial display
    pagesInCat.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    
    result.set(category.slug, pagesInCat);
  }
  
  // Pages without category
  const uncategorized = site.pageRefs?.filter(
    (page) => !page.category || !categories.some(c => c.slug === page.category)
  ) || [];
  if (uncategorized.length > 0) {
    uncategorized.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    result.set('__uncategorized', uncategorized);
  }
  
  return result;
});

let saving = $state(false);

async function handleReorder(categorySlug: string, reorderedPages: PageRef[]) {
  logDebug('ManualTocOrdering', 'Pages reordered in category:', categorySlug);
  
  // Update local state with new order
  const allPages: PageRef[] = [];
  
  for (const [catSlug, pages] of pagesByCategory) {
    if (catSlug === categorySlug) {
      allPages.push(...reorderedPages);
    } else {
      allPages.push(...pages);
    }
  }
  
  // Save to Firestore
  saving = true;
  try {
    await updatePageRefsOrder(site.key, allPages);
    pushSnack(t('snack:site.tocOrderUpdated'));
  } catch (error) {
    logError('ManualTocOrdering', 'Failed to save TOC order:', error);
    pushSnack(t('snack:site.tocOrderUpdateFailed'));
  } finally {
    saving = false;
  }
}

function pageRefToListItem(page: PageRef): CnListItem {
  return {
    id: page.key,
    label: page.name,
    icon: 'article',
  };
}

function listItemsToPageRefs(items: CnListItem[], originalPages: PageRef[]): PageRef[] {
  return items.map(item => {
    const page = originalPages.find(p => p.key === item.id);
    if (!page) throw new Error(`Page not found: ${item.id}`);
    return page;
  });
}
</script>

<section class="surface p-2">
  <h3>
    <cn-icon noun="sort"></cn-icon>
    {t('site:toc.manualOrder.title')}
  </h3>
  <p class="downscaled text-low mb-2">
    {t('site:toc.manualOrder.info')}
  </p>
  
  {#if saving}
    <div class="flex items-center gap-1 mb-2">
      <cn-loader></cn-loader>
      <span class="text-low">{t('site:toc.manualOrder.saving')}</span>
    </div>
  {/if}
  
  {#each categories as category}
    {@const pages = pagesByCategory.get(category.slug) || []}
    {#if pages.length > 0}
      <div class="mb-2">
        <h4 class="downscaled mb-1">{category.name}</h4>
        <SvelteSortableList
          items={pages.map(pageRefToListItem)}
          onitemschanged={(items) => {
            const reordered = listItemsToPageRefs(items, pages);
            handleReorder(category.slug, reordered);
          }}
        />
      </div>
    {/if}
  {/each}
  
  {@const uncategorized = pagesByCategory.get('__uncategorized') || []}
  {#if uncategorized.length > 0}
    <div class="mb-2">
      <h4 class="downscaled mb-1">{t('site:toc.other')}</h4>
      <SvelteSortableList
        items={uncategorized.map(pageRefToListItem)}
        onitemschanged={(items) => {
          const reordered = listItemsToPageRefs(items, uncategorized);
          handleReorder('__uncategorized', reordered);
        }}
      />
    </div>
  {/if}
</section>
```

**3.2 Integrate into TOC Settings**
```svelte
// src/components/svelte/sites/toc/SiteTocTool.svelte
<script lang="ts">
// ... existing imports
import ManualTocOrdering from './ManualTocOrdering.svelte';

// ... existing code
</script>

<WithAuth allow={site.owners.includes($uid)}>
  <div class="content-columns">
    <section>
      <h2>
        <cn-icon noun="tools"></cn-icon>
        {t('site:toc.admin.title')}
      </h2>
      <p>{t('site:toc.admin.info')}</p>
      <label>
        <span>{t('entries:site.sortOrder')}</span>
        <select onchange={setSortOrder}>
          {#each Array.from(sortOrderOptions.entries()) as [value, label]}
            <option
              selected={sortOrder === value}
              value={value}>{label}
            </option>
          {/each}
        </select>
      </label>
    </section>
    
    <!-- Show manual ordering UI when manual sort is selected -->
    {#if site.sortOrder === 'manual'}
      <ManualTocOrdering {site} />
    {/if}
    
    <SiteCategoriesTool {site} />
  </div>
</WithAuth>
```

### Phase 4: Translations & Polish (2 hours)

**4.1 Add Translation Keys**
```json
// Translations needed:
{
  "entries": {
    "site": {
      "sortOrders": {
        "manual": "Manual Order"
      }
    }
  },
  "site": {
    "toc": {
      "manualOrder": {
        "title": "Reorder Pages",
        "info": "Drag and drop pages to change their order in the table of contents.",
        "saving": "Saving order..."
      }
    }
  },
  "snack": {
    "site": {
      "tocOrderUpdated": "Table of contents order updated",
      "tocOrderUpdateFailed": "Failed to update TOC order"
    }
  }
}
```

**4.2 Add Visual Indicators**
- Add drag handle icons to sortable list items
- Add loading state during save
- Add success/error snackbar notifications

---

## Acceptance Criteria

### Functional Requirements

✅ **FR1: Manual Sort Option**
- [ ] "Manual" appears in sort order dropdown
- [ ] Selecting "Manual" shows drag-and-drop interface
- [ ] Other sort options hide drag-and-drop interface

✅ **FR2: Drag-and-Drop Ordering**
- [ ] Pages within each category can be dragged to reorder
- [ ] Visual feedback during drag (drag handles, hover states)
- [ ] Order persists after page refresh
- [ ] Changes save automatically or with explicit "Save" action

✅ **FR3: TOC Display**
- [ ] TOC at `/sites/{siteKey}/toc/` respects manual order
- [ ] Pages appear in custom sequence when `sortOrder: 'manual'`
- [ ] Falls back gracefully if `order` field missing (uses array order)

✅ **FR4: Category Support**
- [ ] Manual ordering works within each category independently
- [ ] Uncategorized pages have their own draggable section
- [ ] Category order itself is not affected (handled separately)

✅ **FR5: Authorization**
- [ ] Only site owners can access TOC settings
- [ ] Only site owners can reorder pages
- [ ] Viewers see correctly ordered TOC but cannot edit

### Non-Functional Requirements

✅ **NFR1: Performance**
- [ ] Drag-and-drop feels responsive (< 100ms feedback)
- [ ] Save operation completes in < 2 seconds
- [ ] TOC renders efficiently even with 50+ pages

✅ **NFR2: Data Integrity**
- [ ] Order values are sequential integers starting at 0
- [ ] No gaps in order sequence after save
- [ ] Existing sites without `order` field continue to work

✅ **NFR3: User Experience**
- [ ] Clear visual distinction between draggable and static elements
- [ ] Loading states during save operation
- [ ] Success/error feedback via snackbar
- [ ] Intuitive drag handles (☰ icon)

---

## Testing Strategy

### Unit Tests

**Schema Validation:**
```typescript
describe('PageRefSchema', () => {
  it('should accept order field', () => {
    const pageRef = {
      key: 'test',
      name: 'Test Page',
      author: 'user123',
      flowTime: 1234567890,
      order: 5,
    };
    expect(() => PageRefSchema.parse(pageRef)).not.toThrow();
  });
  
  it('should allow order field to be optional', () => {
    const pageRef = {
      key: 'test',
      name: 'Test Page',
      author: 'user123',
      flowTime: 1234567890,
      // order field omitted
    };
    expect(() => PageRefSchema.parse(pageRef)).not.toThrow();
  });
});
```

**Sorting Logic:**
```typescript
describe('Manual TOC Sorting', () => {
  it('should sort pages by order field ascending', () => {
    const pages: PageRef[] = [
      { key: 'a', name: 'A', order: 2, /* ... */ },
      { key: 'b', name: 'B', order: 0, /* ... */ },
      { key: 'c', name: 'C', order: 1, /* ... */ },
    ];
    
    pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    expect(pages[0].key).toBe('b'); // order: 0
    expect(pages[1].key).toBe('c'); // order: 1
    expect(pages[2].key).toBe('a'); // order: 2
  });
  
  it('should handle missing order field', () => {
    const pages: PageRef[] = [
      { key: 'a', name: 'A', order: 2, /* ... */ },
      { key: 'b', name: 'B', /* no order */, /* ... */ },
      { key: 'c', name: 'C', order: 1, /* ... */ },
    ];
    
    pages.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    
    expect(pages[0].key).toBe('c'); // order: 1
    expect(pages[1].key).toBe('a'); // order: 2
    expect(pages[2].key).toBe('b'); // no order (goes to end)
  });
});
```

### Integration Tests

**Firestore Update:**
```typescript
describe('updatePageRefsOrder', () => {
  it('should update pageRefs with order indices', async () => {
    const pages: PageRef[] = [
      { key: 'first', name: 'First', /* ... */ },
      { key: 'second', name: 'Second', /* ... */ },
      { key: 'third', name: 'Third', /* ... */ },
    ];
    
    await updatePageRefsOrder('test-site', pages);
    
    const updated = await getSiteData('test-site');
    expect(updated.pageRefs[0].order).toBe(0);
    expect(updated.pageRefs[1].order).toBe(1);
    expect(updated.pageRefs[2].order).toBe(2);
  });
});
```

### E2E Tests

**Manual Ordering Flow:**
```typescript
test('site owner can manually reorder TOC pages', async ({ page }) => {
  // Setup: Create site with multiple pages
  const siteKey = await createTestSite();
  await createTestPage(siteKey, 'page-a', 'Page A');
  await createTestPage(siteKey, 'page-b', 'Page B');
  await createTestPage(siteKey, 'page-c', 'Page C');
  
  // Navigate to TOC settings
  await page.goto(`/sites/${siteKey}/toc/settings`);
  
  // Change sort order to Manual
  await page.selectOption('select', 'manual');
  
  // Verify drag-and-drop UI appears
  await expect(page.locator('cn-sortable-list')).toBeVisible();
  
  // Drag Page C to first position
  const pageC = page.locator('[data-page-key="page-c"]');
  const firstPosition = page.locator('cn-sortable-list').locator('li').first();
  await pageC.dragTo(firstPosition);
  
  // Wait for save
  await expect(page.locator('.snackbar')).toContainText('updated');
  
  // Navigate to TOC and verify order
  await page.goto(`/sites/${siteKey}/toc/`);
  const items = page.locator('ul.compact li');
  await expect(items.nth(0)).toContainText('Page C');
  await expect(items.nth(1)).toContainText('Page A');
  await expect(items.nth(2)).toContainText('Page B');
});

test('manual order persists after page refresh', async ({ page }) => {
  // Setup: Site with manually ordered pages
  const siteKey = await createTestSiteWithManualOrder();
  
  // Load TOC
  await page.goto(`/sites/${siteKey}/toc/`);
  const initialOrder = await page.locator('ul.compact li').allTextContents();
  
  // Refresh page
  await page.reload();
  
  // Verify order unchanged
  const afterRefreshOrder = await page.locator('ul.compact li').allTextContents();
  expect(afterRefreshOrder).toEqual(initialOrder);
});

test('non-owner cannot access manual ordering', async ({ page }) => {
  const siteKey = await createTestSite({ owner: 'other-user' });
  
  await loginAs('current-user');
  await page.goto(`/sites/${siteKey}/toc/settings`);
  
  // Should see 403 or redirect
  expect(page.url()).not.toContain('/toc/settings');
});
```

### Manual Testing Checklist

- [ ] Create site with 5+ pages in different categories
- [ ] Change sort order to "Manual"
- [ ] Drag pages within a category
- [ ] Verify drag handles appear
- [ ] Verify visual feedback during drag
- [ ] Verify order saves (check snackbar)
- [ ] Refresh page and verify order persists
- [ ] View TOC as non-owner (should see custom order)
- [ ] Try to access settings as non-owner (should fail)
- [ ] Test with site with no categories
- [ ] Test with site with 50+ pages (performance)
- [ ] Test drag-and-drop on mobile/touch device

---

## Migration Strategy

### Backward Compatibility

**Existing Sites:**
- Sites without `order` field continue to work
- Auto-sorted sites (`name`, `flowTime`, `createdAt`) unaffected
- Sites with `sortOrder: 'manual'` but no `order` values fall back to array order

**Gradual Adoption:**
1. New schema field is optional
2. Old TOC rendering logic still works
3. Only manual sorting requires `order` field
4. Migration is opt-in (owner selects "Manual" sort)

### Data Migration (Not Required)

No automatic migration needed. Sites adopt manual ordering when:
1. Owner changes `sortOrder` to `manual`
2. Owner drags pages to reorder
3. System assigns `order: 0, 1, 2, ...` based on current array order

**Optional: Bulk Migration Script**
```typescript
// For sites already using sortOrder: 'manual' (if any)
async function migrateManualSites() {
  const sitesRef = serverDB
    .collection(SITES_COLLECTION_NAME)
    .where('sortOrder', '==', 'manual');
  
  const snapshot = await sitesRef.get();
  
  for (const doc of snapshot.docs) {
    const site = parseSite(doc.data(), doc.id);
    
    if (site.pageRefs && !site.pageRefs[0]?.order) {
      // Add order indices based on current array order
      const updated = site.pageRefs.map((ref, index) => ({
        ...ref,
        order: index,
      }));
      
      await doc.ref.update({ pageRefs: updated });
      console.log(`Migrated site: ${site.key}`);
    }
  }
}
```

---

## Future Enhancements

### Phase 2: Cross-Category Reordering
- Allow dragging pages between categories
- Update both `category` and `order` fields

### Phase 3: Bulk Actions
- "Reset to Alphabetical" button
- "Reverse Order" button
- "Sort by Date" as one-time action

### Phase 4: Visual Page Preview
- Show page thumbnail/icon in sortable list
- Display page description on hover

### Phase 5: Keyboard Navigation
- Arrow keys to move items up/down
- Keyboard shortcuts for save/cancel

---

## Known Limitations

1. **No Undo**: Reordering immediately saves; no undo history
2. **Category Order Fixed**: Cannot reorder categories themselves (separate feature)
3. **Single Category Per Page**: Pages can only be in one category
4. **No Nested Categories**: Flat category structure only
5. **Manual Sync**: If pages are added/deleted outside UI, order indices may have gaps

---

## References

- **Cyan Design System**: `<cn-sortable-list>` component docs
- **SiteSchema**: `src/schemas/SiteSchema.ts`
- **Current TOC**: `src/components/server/SiteApp/SiteTocApp.astro`
- **TOC Settings**: `src/components/svelte/sites/toc/SiteTocTool.svelte`
- **Similar Pattern**: PBI-041 (Admin Managed Thread Tags) - field coexistence pattern

---

## Success Metrics

- **Adoption Rate**: % of sites using manual ordering after 1 month
- **Reorder Frequency**: Average number of reorders per site per week
- **Time to Order**: Average time to reorder 10+ pages
- **Error Rate**: Failed save operations per 100 reorders
- **User Feedback**: Qualitative feedback from site owners

**Target Metrics:**
- 15% of active sites adopt manual ordering within 1 month
- Average reorder operation completes in < 3 seconds
- < 1% error rate on save operations
- 0 reports of data loss or corruption

---

## Atomic Commit Plan

This PBI is broken down into simple, atomic commits that can be implemented independently by agents.

### **Commit 1: Add `order` field to PageRefSchema** ✅
**File:** `src/schemas/SiteSchema.ts`

**Changes:**
- Add `order: z.number().optional()` to `PageRefSchema`
- This is backward compatible (optional field)

**Testing:**
- Add unit tests to verify schema accepts `order` field
- Add unit tests to verify `order` field is optional

**Dependencies:** None

**Acceptance:** Schema validation passes with and without `order` field

**Status:** ✅ COMPLETED
- Added `order: z.number().optional()` field to `PageRefSchema`
- Added comprehensive unit tests in `test/schemas/Site.test.ts`
- All 370 tests passing
- No diagnostics errors

---

### **Commit 2: Create `updatePageRefsOrder` client function**
**File:** `src/firebase/client/site/updatePageRefsOrder.ts` (new)

**Changes:**
- Create function that takes `siteKey` and `orderedPageRefs[]`
- Dynamically import Firestore methods for code splitting
- Add `order` index to each page ref (0, 1, 2, ...)
- Update site document with ordered refs
- Include cache purging (with error handling)

**Testing:**
- Unit tests for function logic
- Integration test with mock Firestore

**Dependencies:** Commit 1 (needs schema)

**Acceptance:** Function successfully updates Firestore with order indices

---

### **Commit 3: Update TOC display logic for manual sorting**
**File:** `src/components/server/SiteApp/SiteTocApp.astro`

**Changes:**
- Add sorting logic for `sortBy === 'manual'`
- Sort by `page.order` field ascending
- Fall back to `Number.MAX_SAFE_INTEGER` for missing `order` values

**Testing:**
- Unit tests for sort logic
- E2E test: verify manual order displays correctly

**Dependencies:** Commit 1 (needs schema)

**Acceptance:** TOC displays pages in order by `order` field when `sortOrder: 'manual'`

---

### **Commit 4: Add Manual option to sort order dropdown**
**File:** `src/components/svelte/sites/toc/SiteTocTool.svelte`

**Changes:**
- Add `'manual'` option to `sortOrderOptions` map
- Wire up to existing dropdown (already renders from map)

**Testing:**
- E2E test: verify "Manual" appears in dropdown
- E2E test: verify selecting "Manual" updates site

**Dependencies:** None (schema already has 'manual' in enum)

**Acceptance:** "Manual" option appears and can be selected

---

### **Commit 5: Create ManualTocOrdering component**
**File:** `src/components/svelte/sites/toc/ManualTocOrdering.svelte` (new)

**Changes:**
- Create Svelte component with `site` prop
- Group pages by category using `$derived.by`
- Render `SvelteSortableList` for each category
- Handle `onitemschanged` event → call `updatePageRefsOrder`
- Show loading state during save
- Show success/error snackbar

**Testing:**
- Unit tests for page grouping logic
- E2E test: drag-and-drop within category

**Dependencies:** 
- Commit 1 (schema)
- Commit 2 (updatePageRefsOrder function)

**Acceptance:** Component renders draggable page lists grouped by category

---

### **Commit 6: Integrate ManualTocOrdering into settings**
**File:** `src/components/svelte/sites/toc/SiteTocTool.svelte`

**Changes:**
- Import `ManualTocOrdering` component
- Add conditional rendering: `{#if site.sortOrder === 'manual'}`
- Place between sort order dropdown and categories tool

**Testing:**
- E2E test: verify component appears when Manual selected
- E2E test: verify component hidden for other sort orders

**Dependencies:**
- Commit 4 (Manual option)
- Commit 5 (ManualTocOrdering component)

**Acceptance:** Manual ordering UI appears only when `sortOrder === 'manual'`

---

### **Commit 7: Add translation keys**
**Files:** Translation files (JSON)

**Changes:**
Add keys for:
- `entries.site.sortOrders.manual`: "Manual Order"
- `site.toc.manualOrder.title`: "Reorder Pages"
- `site.toc.manualOrder.info`: "Drag and drop pages to change their order..."
- `site.toc.manualOrder.saving`: "Saving order..."
- `snack.site.tocOrderUpdated`: "Table of contents order updated"
- `snack.site.tocOrderUpdateFailed`: "Failed to update TOC order"

**Testing:**
- Manual verification in UI
- Check all languages have keys

**Dependencies:** None (standalone)

**Acceptance:** All text displays correctly in multiple languages

---

### **Commit 8: Add visual polish and feedback**
**Files:**
- `ManualTocOrdering.svelte` (enhance)
- CSS as needed

**Changes:**
- Ensure drag handles (`☰`) are visible
- Add hover states
- Verify loading spinner displays properly
- Add visual spacing between categories
- Test responsive behavior

**Testing:**
- Manual UI testing
- Mobile/touch testing
- Cross-browser testing

**Dependencies:** Commit 5, 6 (component must exist)

**Acceptance:** UI feels polished and responsive

---

### Dependency Graph

```
Commit 1 (Schema)
    ├── Commit 2 (updatePageRefsOrder)
    │       └── Commit 5 (ManualTocOrdering component)
    │               └── Commit 6 (Integration)
    │                       └── Commit 8 (Polish)
    └── Commit 3 (Display logic)

Commit 4 (Dropdown option) → Commit 6 (Integration)

Commit 7 (Translations) → Independent
```

### Recommended Implementation Order

1. **Commit 1** → Schema (foundation)
2. **Commit 7** → Translations (parallel, no dependencies)
3. **Commit 2** → Client function (depends on schema)
4. **Commit 3** → Display logic (depends on schema)
5. **Commit 4** → Dropdown option (can be done anytime)
6. **Commit 5** → ManualTocOrdering component (depends on 1, 2)
7. **Commit 6** → Integration (depends on 4, 5)
8. **Commit 8** → Polish (final touches)

### Notes for Implementation

- **Use pnpm**, not npm
- Follow existing patterns in codebase
- Use dynamic imports for Firebase client methods
- Use `SITES_COLLECTION_NAME` constant, not hardcoded 'sites'
- Follow Svelte runes mode patterns (`$state`, `$derived.by`, `$props`)
- Import from aliases (`@schemas/`, `@firebase/`, etc.)
- Use `logDebug`, `logError` from `@utils/logHelpers`
- Use `pushSnack` from `@utils/client/snackUtils`
- Each commit should be testable independently
- Write tests before or alongside implementation