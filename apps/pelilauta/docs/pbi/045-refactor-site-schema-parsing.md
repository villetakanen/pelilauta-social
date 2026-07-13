# PBI-45: Refactor Site Schema Parsing to Use Zod-Native Defaults

**Priority:** Blocker for PBI-43  
**Type:** Technical Debt / Refactor  
**Estimated Effort:** 3-5 hours  
**Status:** In Progress (Phase 1 Complete)

## Implementation Status

**Current Phase:** Phase 1 Complete ✅, Starting Phase 2

### Completed Work

- ✅ **Phase 1 (Commit c3cc699)**: Add Zod defaults to SiteSchema
  - Added `.default(false)` to `customPageKeys` 
  - Added `.default(false)` to `usePlainTextURLs`
  - Updated `emptySite` constant to include new default fields
  - All existing defaults confirmed: `name`, `system`, `hidden`, `sortOrder`, `license`, `useSidebar`
  - `createSite()` and `migrateLegacySiteFields()` helper functions already present
  - All 391 tests passing
  - No diagnostics errors

## Problem Statement

The `parseSite()` and `siteFrom()` functions in `src/schemas/SiteSchema.ts` use a legacy pattern where:
- Default values are manually assigned outside the Zod schema
- Legacy field transformations are embedded in parsing logic
- Mixing concerns: validation, default coercion, and legacy support happen in the same function
- Makes schema behavior unpredictable since defaults aren't enforced by Zod

This blocks PBI-43 because proper schema validation with consistent defaults is required.

## Current State

The `parseSite()` function manually handles defaults:

```typescript
// parseSite manually handles defaults
const system = data.system ? data.system : "homebrew";
const hidden = data.hidden ? data.hidden : false;
const homepage = data.homepage ? data.homepage : key;
const sortOrder = data.sortOrder ? data.sortOrder : "name";
// ... more manual coercion

return SiteSchema.parse({
  ...toClientEntry(data),
  name: data.name || "[...]",
  system,
  hidden,
  homepage,
  sortOrder,
  // ... more fields
});
```

The `siteFrom()` function also manually coerces defaults:

```typescript
const coerced: Partial<Site> = {
  ...template,
  key: key ?? template.key ?? "",
  flowTime: template.flowTime ?? 0,
  name: template.name || "-",
  system: template.system || "homebrew",
  hidden: template.hidden || false,
  // ... more manual defaults
};

return SiteSchema.parse(coerced);
```

## Acceptance Criteria

### 1. Update SiteSchema with Zod Defaults ✅

- [x] Add `.default()` to all optional fields that need default values
- [ ] Remove manual default assignment from `parseSite` and `siteFrom` (Phase 2)
- [x] Ensure `useSidebar` defaults to `true` (as per current logic)
- [x] Ensure `license` defaults to `"0"`
- [x] Ensure `sortOrder` defaults to `"name"`
- [x] Ensure `system` defaults to `"homebrew"`
- [x] Ensure `hidden` defaults to `false`
- [x] Ensure `customPageKeys` defaults to `false`
- [x] Ensure `usePlainTextURLs` defaults to `false`

### 2. Create Clean `createSite()` Factory Function ✅

- [x] Replace `siteFrom()` with `createSite(partial: Partial<Site>): Site`
- [x] Should rely on schema defaults, only requiring minimal input
- [x] Should NOT include legacy transformation logic
- [x] Should be used for creating new Site objects
- **Note:** Already exists in codebase, ready to use

### 3. Deprecate `parseSite()`

- [ ] Mark as `@deprecated` in JSDoc
- [ ] Add comment: "Use SiteSchema.parse() for validation or createSite() for creation"
- [ ] Consider removing if no callers exist, or plan removal in next major version

### 4. Handle Legacy Field Transformations ✅

- [x] Document the `customPageKeys` ↔ `usePlainTextURLs` relationship
- [x] **Decision made**: Keep legacy support via separate function
- [x] Extract to `migrateLegacySiteFields()` function, separate from parsing
- **Note:** Already exists in codebase with proper separation of concerns

### 5. Update All Callers (Complete Removal)

**IMPORTANT:** Remove all calls to `parseSite()` and `siteFrom()` - do not just deprecate.

#### Files Using `parseSite()` (27 occurrences)

**Client-side Firebase operations:**
- [ ] `src/firebase/client/page/addPageRef.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/firebase/client/site/addAssetToSite.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/firebase/client/site/createSite.ts` - Use `createSite()` for new site creation
- [ ] `src/firebase/client/site/deletePage.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/firebase/client/site/deleteSiteFromAssets.ts` - Use `SiteSchema.parse()` with `toClientEntry()`

**Server-side operations:**
- [ ] `src/components/server/profile/ProfileSiteList.astro` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/firebase/server/sites.ts` - Use `SiteSchema.parse()` with `toClientEntry()`

**Astro pages (22 files):**
- [ ] `src/pages/sites/[siteKey]/[pageKey]/delete.astro`
- [ ] `src/pages/sites/[siteKey]/assets/[assetName].astro`
- [ ] `src/pages/sites/[siteKey]/assets/index.astro`
- [ ] `src/pages/sites/[siteKey]/characters.astro`
- [ ] `src/pages/sites/[siteKey]/clocks.astro`
- [ ] `src/pages/sites/[siteKey]/create/clock.astro`
- [ ] `src/pages/sites/[siteKey]/create/handout.astro`
- [ ] `src/pages/sites/[siteKey]/data.astro`
- [ ] `src/pages/sites/[siteKey]/delete/clock/[id].astro`
- [ ] `src/pages/sites/[siteKey]/handouts/[id]/edit.astro`
- [ ] `src/pages/sites/[siteKey]/handouts/[id]/index.astro`
- [ ] `src/pages/sites/[siteKey]/import.astro`
- [ ] `src/pages/sites/[siteKey]/members.astro`
- [ ] `src/pages/sites/[siteKey]/options.astro`
- [ ] `src/pages/sites/[siteKey]/toc/index.astro`
- [ ] `src/pages/sites/[siteKey]/toc/settings.astro`

**Client-side stores:**
- [ ] `src/stores/site/index.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/stores/userSites/index.ts` (2 occurrences) - Use `SiteSchema.parse()` with `toClientEntry()`

#### Files Using `siteFrom()` (5 occurrences)

- [ ] `src/components/server/profile/ProfileSiteListPlaceholder.astro` - Use `createSite()`
- [ ] `src/firebase/server/sites.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `src/pages/api/sites/index.ts` - Use `SiteSchema.parse()` with `toClientEntry()`
- [ ] `test/schemas/Site.test.ts` - Update test to use `createSite()`

#### Replacement Pattern

```typescript
// ❌ Old pattern
const site = parseSite(toClientEntry(siteDoc.data()), siteKey);

// ✅ New pattern - for parsing existing data
const site = SiteSchema.parse({
  ...toClientEntry(siteDoc.data()),
  key: siteKey,
});

// ❌ Old pattern
const site = siteFrom({ name: 'New Site' }, 'site-key');

// ✅ New pattern - for creating new sites
const site = createSite({ 
  name: 'New Site',
  key: 'site-key',
});
```

### 6. Tests

- [ ] Verify schema defaults work correctly
- [ ] Verify `createSite()` produces valid Site objects
- [ ] Test edge cases (empty objects, partial data, etc.)
- [ ] Ensure no regressions in existing site creation/loading

## Technical Implementation

### Files to Modify

Primary file:
- `src/schemas/SiteSchema.ts`

Find all callers:
```bash
grep -r "parseSite\|siteFrom" --include="*.ts" --include="*.tsx" --include="*.astro"
```

### Example Refactored Code

```typescript
// Updated schema with Zod defaults
export const SiteSchema = EntrySchema.extend({
  name: z.string().default("[...]"),
  system: z.string().default("homebrew"),
  hidden: z.boolean().default(false),
  sortOrder: SiteSortOrderSchema.default("name"),
  useSidebar: z.boolean().default(true),
  license: z.string().default("0"),
  homepage: z.string().optional(),
  description: z.string().optional(),
  posterURL: z.string().optional(),
  avatarURL: z.string().optional(),
  backgroundURL: z.string().optional(),
  players: z.array(z.string()).optional(),
  assets: z.array(AssetSchema).optional(),
  customPageKeys: z.boolean().optional(),
  pageRefs: z.array(PageRefSchema).optional(),
  pageCategories: z.array(CategoryRefSchema).optional(),
  usePlayers: z.boolean().optional(),
  useClocks: z.boolean().optional(),
  useHandouts: z.boolean().optional(),
  useRecentChanges: z.boolean().optional(),
  sidebarKey: z.string().optional(),
  usePlainTextURLs: z.boolean().optional(),
  useCharacters: z.boolean().optional(),
  useCharacterKeeper: z.boolean().optional(),
  characterKeeperSheetKey: z.string().optional(),
});

/**
 * Creates a new Site object with default values.
 * Use this for creating new sites from scratch or templates.
 * 
 * @param partial - Partial site data to merge with defaults
 * @returns Valid Site object with all required fields
 */
export function createSite(partial: Partial<Site> = {}): Site {
  return SiteSchema.parse({
    key: partial.key ?? "",
    flowTime: partial.flowTime ?? Date.now(),
    owners: partial.owners ?? [],
    ...partial,
  });
}

/**
 * Migrates legacy site data fields to current schema.
 * Handles backwards compatibility transformations.
 * 
 * @param data - Legacy site data
 * @returns Migrated site data compatible with current schema
 */
export function migrateLegacySiteFields(data: Partial<Site>): Partial<Site> {
  const migrated = { ...data };
  
  // Handle customPageKeys ↔ usePlainTextURLs relationship
  // customPageKeys is legacy, inverted logic of usePlainTextURLs
  if (data.customPageKeys !== undefined && data.usePlainTextURLs === undefined) {
    migrated.usePlainTextURLs = !data.customPageKeys;
  }
  
  return migrated;
}

/**
 * @deprecated Use SiteSchema.parse() for validation or createSite() for new objects
 * This function will be removed in a future version.
 */
export function parseSite(data: Partial<Site>, newKey?: string): Site {
  // Migrate legacy fields first
  const migrated = migrateLegacySiteFields(data);
  
  // Delegate to createSite
  return createSite({ 
    ...migrated, 
    key: newKey ?? migrated.key 
  });
}

/**
 * @deprecated Use createSite() instead
 */
export function siteFrom(template: Partial<Site>, key?: string): Site {
  return createSite({ ...template, key: key ?? template.key });
}
```

## Migration Strategy

### Phase 1: Update SiteSchema
1. Update `SiteSchema` with `.default()` values for all required defaults
2. Add `createSite()` function for creating new sites
3. Add `migrateLegacySiteFields()` helper if legacy support is needed
4. **DO NOT mark as deprecated** - we're removing immediately

**Commit:** `feat(schema): add Zod defaults and createSite() to SiteSchema`

### Phase 2: Atomic Commits Per Usage (32 commits)

Each commit should follow this pattern:
1. **Identify e2e test** that covers the functionality
2. **Run test before**: `pnpm run test:e2e -- <test-file>`
3. **Make the change** to remove `parseSite()` or `siteFrom()`
4. **Run test after**: Verify it still passes
5. **Commit atomically** with descriptive message

#### Commit 1: Unit Tests
- **Files**: `test/schemas/Site.test.ts`
- **E2E Coverage**: N/A (unit test)
- **Test Command**: `pnpm run test`
- **Change**: Replace `siteFrom()` with `createSite()`
- **Commit**: `test(schema): update Site.test.ts to use createSite()`

#### Commit 2: Site Creation
- **Files**: `src/firebase/client/site/createSite.ts`
- **E2E Coverage**: `e2e/create-page.spec.ts` (creates site context)
- **Test Command**: `pnpm run test:e2e -- create-page`
- **Change**: Use `createSite()` for new site creation
- **Commit**: `refactor(site): use createSite() in client site creation`

#### Commit 3: Server Site Loading
- **Files**: `src/firebase/server/sites.ts` (2 occurrences)
- **E2E Coverage**: `e2e/site-page.spec.ts`
- **Test Command**: `pnpm run test:e2e -- site-page`
- **Change**: Replace `parseSite()` and `siteFrom()` with `SiteSchema.parse()`
- **Commit**: `refactor(site): use SiteSchema.parse() in server site loading`

#### Commit 4: Site Store Subscription
- **Files**: `src/stores/site/index.ts`
- **E2E Coverage**: `e2e/site-page.spec.ts` (tests store initialization)
- **Test Command**: `pnpm run test:e2e -- site-page`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(store): use SiteSchema.parse() in site store`

#### Commit 5: User Sites Store
- **Files**: `src/stores/userSites/index.ts` (2 occurrences)
- **E2E Coverage**: `e2e/front-page.spec.ts` (may show user sites)
- **Test Command**: `pnpm run test:e2e -- front-page`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(store): use SiteSchema.parse() in userSites store`

#### Commit 6: Add Page Reference
- **Files**: `src/firebase/client/page/addPageRef.ts`
- **E2E Coverage**: `e2e/create-page.spec.ts`
- **Test Command**: `pnpm run test:e2e -- create-page`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(page): use SiteSchema.parse() in addPageRef`

#### Commit 7: Delete Page
- **Files**: `src/firebase/client/site/deletePage.ts`
- **E2E Coverage**: `e2e/page-editor.spec.ts` (if it tests deletion)
- **Test Command**: `pnpm run test:e2e -- page-editor`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(page): use SiteSchema.parse() in deletePage`

#### Commit 8: Add Asset to Site
- **Files**: `src/firebase/client/site/addAssetToSite.ts`
- **E2E Coverage**: `e2e/site-asset-upload.spec.ts`
- **Test Command**: `pnpm run test:e2e -- site-asset-upload`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(asset): use SiteSchema.parse() in addAssetToSite`

#### Commit 9: Delete Site Asset
- **Files**: `src/firebase/client/site/deleteSiteFromAssets.ts`
- **E2E Coverage**: `e2e/site-asset-upload.spec.ts` (tests delete)
- **Test Command**: `pnpm run test:e2e -- site-asset-upload`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(asset): use SiteSchema.parse() in deleteSiteAsset`

#### Commit 10: Profile Site List (Server)
- **Files**: `src/components/server/profile/ProfileSiteList.astro`
- **E2E Coverage**: Manual test - profile page
- **Test Command**: Manual verification at `/profile`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(profile): use SiteSchema.parse() in ProfileSiteList`

#### Commit 11: Profile Site List Placeholder
- **Files**: `src/components/server/profile/ProfileSiteListPlaceholder.astro`
- **E2E Coverage**: Manual test - profile page loading state
- **Test Command**: Manual verification at `/profile`
- **Change**: Replace `siteFrom()` with `createSite()`
- **Commit**: `refactor(profile): use createSite() in ProfileSiteListPlaceholder`

#### Commit 12: Public Sites API
- **Files**: `src/pages/api/sites/index.ts`
- **E2E Coverage**: `e2e/sitemap.spec.ts` or `e2e/front-page.spec.ts`
- **Test Command**: `pnpm run test:e2e -- sitemap`
- **Change**: Replace `siteFrom()` with `SiteSchema.parse()`
- **Commit**: `refactor(api): use SiteSchema.parse() in sites API`

#### Commit 13: Page Delete Confirmation
- **Files**: `src/pages/sites/[siteKey]/[pageKey]/delete.astro`
- **E2E Coverage**: Manual test or extend `page-editor.spec.ts`
- **Test Command**: Manual verification of delete flow
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(page): use SiteSchema.parse() in delete confirmation`

#### Commit 14: Asset Detail Page
- **Files**: `src/pages/sites/[siteKey]/assets/[assetName].astro`
- **E2E Coverage**: `e2e/site-asset-upload.spec.ts`
- **Test Command**: `pnpm run test:e2e -- site-asset-upload`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(asset): use SiteSchema.parse() in asset detail page`

#### Commit 15: Assets Index Page
- **Files**: `src/pages/sites/[siteKey]/assets/index.astro`
- **E2E Coverage**: `e2e/site-asset-upload.spec.ts`
- **Test Command**: `pnpm run test:e2e -- site-asset-upload`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(asset): use SiteSchema.parse() in assets index page`

#### Commit 16: Characters Page
- **Files**: `src/pages/sites/[siteKey]/characters.astro`
- **E2E Coverage**: `e2e/create-character.spec.ts` or `e2e/character-keeper.spec.ts`
- **Test Command**: `pnpm run test:e2e -- create-character`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(character): use SiteSchema.parse() in characters page`

#### Commit 17: Clocks Page
- **Files**: `src/pages/sites/[siteKey]/clocks.astro`
- **E2E Coverage**: Manual test - clocks feature
- **Test Command**: Manual verification at `/sites/e2e-test-site/clocks`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(clock): use SiteSchema.parse() in clocks page`

#### Commit 18: Create Clock Page
- **Files**: `src/pages/sites/[siteKey]/create/clock.astro`
- **E2E Coverage**: Manual test - create clock flow
- **Test Command**: Manual verification of create clock
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(clock): use SiteSchema.parse() in create clock page`

#### Commit 19: Create Handout Page
- **Files**: `src/pages/sites/[siteKey]/create/handout.astro`
- **E2E Coverage**: Manual test - create handout flow
- **Test Command**: Manual verification of create handout
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(handout): use SiteSchema.parse() in create handout page`

#### Commit 20: Site Data Page
- **Files**: `src/pages/sites/[siteKey]/data.astro`
- **E2E Coverage**: Manual test - site data export
- **Test Command**: Manual verification at `/sites/e2e-test-site/data`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(site): use SiteSchema.parse() in data page`

#### Commit 21: Delete Clock Page
- **Files**: `src/pages/sites/[siteKey]/delete/clock/[id].astro`
- **E2E Coverage**: Manual test - delete clock confirmation
- **Test Command**: Manual verification of delete clock
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(clock): use SiteSchema.parse() in delete clock page`

#### Commit 22: Edit Handout Page
- **Files**: `src/pages/sites/[siteKey]/handouts/[id]/edit.astro`
- **E2E Coverage**: Manual test - edit handout
- **Test Command**: Manual verification of edit handout
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(handout): use SiteSchema.parse() in edit handout page`

#### Commit 23: View Handout Page
- **Files**: `src/pages/sites/[siteKey]/handouts/[id]/index.astro`
- **E2E Coverage**: Manual test - view handout
- **Test Command**: Manual verification of view handout
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(handout): use SiteSchema.parse() in view handout page`

#### Commit 24: Import Page
- **Files**: `src/pages/sites/[siteKey]/import.astro`
- **E2E Coverage**: Manual test - import functionality
- **Test Command**: Manual verification at `/sites/e2e-test-site/import`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(site): use SiteSchema.parse() in import page`

#### Commit 25: Members Page
- **Files**: `src/pages/sites/[siteKey]/members.astro`
- **E2E Coverage**: Manual test - site members
- **Test Command**: Manual verification at `/sites/e2e-test-site/members`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(site): use SiteSchema.parse() in members page`

#### Commit 26: Options Page
- **Files**: `src/pages/sites/[siteKey]/options.astro`
- **E2E Coverage**: Manual test - site settings
- **Test Command**: Manual verification at `/sites/e2e-test-site/options`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(site): use SiteSchema.parse() in options page`

#### Commit 27: TOC Index Page
- **Files**: `src/pages/sites/[siteKey]/toc/index.astro`
- **E2E Coverage**: `e2e/create-page.spec.ts` (tests category selection)
- **Test Command**: `pnpm run test:e2e -- create-page`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(toc): use SiteSchema.parse() in TOC index page`

#### Commit 28: TOC Settings Page
- **Files**: `src/pages/sites/[siteKey]/toc/settings.astro`
- **E2E Coverage**: Manual test - TOC settings (PBI-43)
- **Test Command**: Manual verification at `/sites/e2e-test-site/toc/settings`
- **Change**: Replace `parseSite()` with `SiteSchema.parse()`
- **Commit**: `refactor(toc): use SiteSchema.parse() in TOC settings page`

### Phase 3: Remove Old Functions
1. Delete `parseSite()` function from `src/schemas/SiteSchema.ts`
2. Delete `siteFrom()` function from `src/schemas/SiteSchema.ts`
3. Verify no lingering references with `grep -r "parseSite\|siteFrom"`
4. Run full test suite: `pnpm run test && pnpm run test:e2e`
5. Test manually in development environment

**Commit:** `refactor(schema): remove deprecated parseSite() and siteFrom()`

## Definition of Done

- [x] Document created and reviewed
- [ ] **Phase 1: Schema Updates (1 commit)**
  - [ ] SiteSchema uses Zod `.default()` for all fields needing defaults
  - [ ] `createSite()` function implemented
  - [ ] `migrateLegacySiteFields()` implemented (if needed)
  - [ ] Tests updated and passing
  - [ ] Commit created
- [ ] **Phase 2: Atomic Commits (28 commits)**
  - [ ] Commit 1: Unit tests updated
  - [ ] Commit 2: Site creation updated
  - [ ] Commit 3: Server site loading updated
  - [ ] Commit 4: Site store updated
  - [ ] Commit 5: User sites store updated
  - [ ] Commit 6: Add page reference updated
  - [ ] Commit 7: Delete page updated
  - [ ] Commit 8: Add asset updated
  - [ ] Commit 9: Delete asset updated
  - [ ] Commit 10: Profile site list updated
  - [ ] Commit 11: Profile placeholder updated
  - [ ] Commit 12: Public sites API updated
  - [ ] Commit 13-28: All Astro pages updated (16 commits)
  - [ ] Each commit verified with corresponding e2e test
  - [ ] All commits pass `pnpm run test` and relevant e2e tests
- [ ] **Phase 3: Cleanup (1 commit)**
  - [ ] `parseSite()` function removed from schema
  - [ ] `siteFrom()` function removed from schema
  - [ ] No grep results for `parseSite\|siteFrom`
  - [ ] All tests passing
  - [ ] Code passes Biome linting
  - [ ] Commit created
- [ ] **Validation**
  - [ ] Full test suite passes: `pnpm run test && pnpm run test:e2e`
  - [ ] Manual testing: Create new site works
  - [ ] Manual testing: Load existing site works
  - [ ] Manual testing: Update site works
  - [ ] Manual testing: Assets upload/delete works
  - [ ] Manual testing: Page creation/deletion works
  - [ ] No regressions in site functionality
  - [ ] PBI-43 can proceed without schema validation issues

## Dependencies

**Blocks:** PBI-43  
**Blocked By:** None  
**Related:** PBI-44 (Update Site to SSR)

## Notes

- This refactor follows Zod best practices where the schema itself is the source of truth for validation and default values
- Consider whether legacy field transformations should be kept or if this is a good opportunity for a breaking change
- Ensure any changes are backwards compatible with existing Firestore data
- The `customPageKeys` ↔ `usePlainTextURLs` relationship needs careful handling as they have inverted boolean logic

## E2E Test Coverage Summary

**Existing E2E Tests:**
- ✅ `site-page.spec.ts` - Site loading, store initialization, SSR
- ✅ `create-page.spec.ts` - Page creation, category selection, TOC
- ✅ `site-asset-upload.spec.ts` - Asset upload, delete, metadata
- ✅ `page-editor.spec.ts` - Page editing (may cover deletion)
- ✅ `create-character.spec.ts` - Character creation
- ✅ `character-keeper.spec.ts` - Character keeper feature
- ✅ `sitemap.spec.ts` - Public sites listing
- ✅ `front-page.spec.ts` - Front page with user sites

**Features Without E2E Coverage (Manual Testing Required):**
- ⚠️ Clocks (create, view, delete)
- ⚠️ Handouts (create, view, edit)
- ⚠️ Site data export
- ⚠️ Site import
- ⚠️ Site members management
- ⚠️ Site options/settings
- ⚠️ TOC settings (PBI-43 will add this)

**Testing Strategy:**
1. Run existing e2e tests after each relevant commit
2. For features without e2e coverage, perform manual testing
3. Consider adding e2e tests for uncovered features in future PBIs

## Testing Checklist

**Unit Tests:**
- [ ] Create site with minimal data using `createSite()`
- [ ] Parse valid site data with all fields using `SiteSchema.parse()`
- [ ] Parse site data with missing optional fields (should use defaults)
- [ ] Parse legacy site data with `migrateLegacySiteFields()` if implemented
- [ ] Verify `useSidebar` defaults to `true`
- [ ] Verify `license` defaults to `"0"`
- [ ] Verify `sortOrder` defaults to `"name"`
- [ ] Verify `system` defaults to `"homebrew"`
- [ ] Verify `hidden` defaults to `false`

**Integration Tests:**
- [ ] Site creation via API endpoint works
- [ ] Site loading from Firestore works
- [ ] Site updates via API work
- [ ] Page operations (add/delete) still work
- [ ] Asset operations still work
- [ ] Store subscriptions still work

**Manual UI Tests:**
- [ ] Create new site from UI
- [ ] Load site details page
- [ ] Edit site settings
- [ ] Add/remove pages
- [ ] View site in profile list
- [ ] View public sites list

**Validation:**
- [ ] No console errors on any site page
- [ ] All 32 modified files work correctly
- [ ] `pnpm run test` passes
- [ ] `pnpm run build` succeeds
- [ ] No TypeScript errors