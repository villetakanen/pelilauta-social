# PBI-041 Summary: Thread Labels and Tags

## Overview

Created comprehensive Product Backlog Item for adding moderator-assigned labels to forum threads that persist through user edits.

## Problem

Currently, when users edit their threads, all tags are re-extracted from content, causing any admin-added tags to be lost. This prevents admins from:
- Adding tags for better content discovery
- Enforcing community standards
- Adding content warnings or categorizations
- Curating content without user interference

## Solution

Add separate `labels` field to threads that:
- **Persists through user edits** - Never touched by normal thread updates
- **Admin-only modification** - Requires admin authentication to change
- **Merged for display** - Combined with user tags for discovery
- **Visually distinct** - Different styling to indicate official curation

## Key Components

### 1. Schema Changes
- Add `labels: z.array(z.string()).optional()` to `ThreadSchema`
- Keep separate from user `tags` field
- Optional field = non-breaking change

### 2. Helper Functions
**File:** `src/utils/shared/threadTagHelpers.ts` (new)
- `getAllThreadTags()` - Combines user + labels with deduplication
- `isAdminTag()` - Checks if a tag is admin-managed
- `normalizeTag()` - Lowercase and trim for consistency

### 3. API Endpoints
**File:** `src/pages/api/threads/[threadKey]/labels.ts` (new)
- `POST` - Add labels (admin-only)
- `DELETE` - Remove labels (admin-only)
- Server-side admin verification via `isAdmin(uid)`
- Updates tag index with combined tags
- Cache purging for affected pages

### 4. UI Components
**File:** `src/components/svelte/threads/LabelManager.svelte` (new)
- Input field to add labels
- Display all tags with visual distinction
- Remove button for labels only
- Legend explaining tag types

**Updated:** `ThreadAdminActions.svelte` to include tag manager

**Updated:** `ThreadInfoSection.astro` for visual distinction

### 5. Visual Design
- **Admin tags**: Accent color background/border
- **User tags**: Standard elevated background
- **Legend**: Explains difference between types
- **No delete button** on user tags (read-only for admins)

## Implementation Phases

### Phase 1: Schema and Helpers (2 hours)
- Add `labels` field to schema
- Create helper functions
- Unit tests
- ✅ Non-breaking

### Phase 2: API Endpoints (3-4 hours)
- Create labels API
- Update thread update endpoint
- API unit tests
- ✅ Backend-only (no UI impact)

### Phase 3: UI Components (3-4 hours)
- Create LabelManager component
- Update ThreadAdminActions
- Update tag display styling
- i18n translations
- E2E tests

### Phase 4: Testing and Refinement (2 hours)
- Full test suite
- Manual testing
- Bug fixes
- Documentation

**Total Estimate:** 10-12 hours

## Technical Details

### Data Flow

**When user edits thread:**
```
1. User updates content with new hashtags
2. Client extracts tags: ['dnd', 'lfg']
3. API updates thread.tags = ['dnd', 'lfg']
4. thread.labels remains unchanged
5. Tag index updated with combined tags
```

**When admin adds tag:**
```
1. Admin calls POST /api/threads/{key}/admin-tags
2. Server verifies isAdmin(uid)
3. Updates thread.labels array
4. Tag index updated with combined tags
5. Cache purged
```

### Tag Index Updates

Thread update endpoint modified to use combined tags:
```typescript
const allTags = getAllThreadTags(updatedThread);

if (allTags.length > 0) {
  const tagData = toTagData(
    { ...updatedThread, tags: allTags }, // Combined tags
    threadKey,
    'thread',
    flowTime
  );
  await serverDB.collection('tags').doc(threadKey).set(tagData);
}
```

## Testing Strategy

### Unit Tests
- Helper functions (getAllThreadTags, isAdminTag, normalizeTag)
- Tag deduplication logic
- Case normalization

### API Tests
- Admin authentication required
- Non-admin rejection (403)
- Unauthenticated rejection (401)
- Tag addition/removal
- Tag index updates

### E2E Tests
- Add admin tag via UI
- Remove admin tag via UI
- Admin tags persist through user edits
- Visual distinction rendering
- Authorization checks

### Manual Testing
- Full workflow as admin
- Full workflow as non-admin user
- Edge cases (empty tags, duplicates, etc.)
- Cache purging verification

## Acceptance Criteria

### Must Have
- ✅ Admin can add tags to any thread
- ✅ Admin can remove their own labels
- ✅ Admin tags persist through user edits
- ✅ Combined tags appear in tag index
- ✅ Visual distinction between tag types
- ✅ API requires admin authentication
- ✅ No breaking changes to existing features

### Should Have
- ✅ Tag normalization (lowercase, trim)
- ✅ Duplicate deduplication
- ✅ Success/error notifications
- ✅ Legend explaining tag types
- ✅ Cache purging after changes

### Nice to Have (Future)
- Tag templates for common categories
- Bulk tag operations
- Tag analytics
- Audit log of tag changes

## Files to Create

1. `docs/pbi/041-admin-managed-thread-tags.md` ✅
2. `src/utils/shared/threadTagHelpers.ts`
3. `src/pages/api/threads/[threadKey]/labels.ts`
4. `src/components/svelte/threads/LabelManager.svelte`
5. `test/utils/threadTagHelpers.test.ts`
6. `test/api/threads-admin-tags.test.ts`
7. `e2e/admin-thread-tags.spec.ts`

## Files to Modify

1. `src/schemas/ThreadSchema.ts` - Add labels field
2. `src/pages/api/threads/[threadKey].ts` - Use combined tags for index
3. `src/components/svelte/threads/ThreadAdminActions.svelte` - Add tag manager
4. `src/components/server/ThreadsApp/ThreadInfoSection.astro` - Visual distinction
5. `src/locales/en/admin.ts` - Add translations
6. `src/locales/fi/admin.ts` - Add translations

## i18n Keys Added

**English:**
- `admin:thread_tags.title` - "Admin Tags"
- `admin:thread_tags.add_placeholder` - "Add admin tag..."
- `admin:thread_tags.admin_tag` - "Admin tag"
- `admin:thread_tags.user_tag` - "User tag"
- `admin:thread_tags.no_tags` - "No tags on this thread"
- `admin:thread_tags.already_exists` - "Tag already exists"
- `admin:thread_tags.added` - "Admin tag added"
- `admin:thread_tags.add_failed` - "Failed to add admin tag"
- `admin:thread_tags.removed` - "Admin tag removed"
- `admin:thread_tags.remove_failed` - "Failed to remove admin tag"

**Finnish:** (Same keys with Finnish translations)

## Migration Safety

### Non-Breaking Changes
- `labels` field is optional (existing threads work without it)
- New API endpoints don't affect existing endpoints
- UI only visible to admins (no impact on regular users)
- Tag index logic enhanced but backward compatible

### Rollback Strategy
1. **UI rollback** - Hide components (5 min)
2. **API rollback** - Revert endpoints (15 min)
3. **Full rollback** - Revert all changes (30 min)

**Risk Level:** Low
- Admin-only feature
- Optional schema field
- Gradual deployment possible
- No data loss on rollback

## Success Metrics (2 weeks post-launch)

- ✅ At least 5 threads have labels
- ✅ Zero labels lost during user edits
- ✅ < 0.5% error rate on admin tag operations
- ✅ Positive admin user feedback
- ✅ No performance degradation

## Related PBIs

- **PBI-030**: Fix Thread Tags Update - Tag index update patterns
- **PBI-031**: Migrate Thread Updates to SSR API - Thread update architecture
- **PBI-020**: Comprehensive Forum Admin Tool - Admin UI patterns

## Next Steps

1. ✅ Review PBI-041 document with team
2. Schedule implementation sprint
3. Assign developer(s)
4. Begin Phase 1 (schema + helpers)
5. Test each phase before moving to next
6. Deploy to production
7. Monitor metrics

## Notes

### Why Separate Fields?
- **Clarity**: Clear separation between user and admin curation
- **Persistence**: Easy to preserve labels during user edits
- **Querying**: Simple to query admin-tagged content
- **Maintenance**: Easier to understand and debug

### Why Visual Distinction?
- **Transparency**: Users see official curation
- **Trust**: Indicates admin endorsement/categorization
- **Education**: Helps users understand community standards
- **UX**: Clear which tags are user-generated vs curated

### Security First
- All admin operations verified server-side
- No client-side trust
- Proper error messages (no info leakage)
- Admin endpoints separate from user endpoints

## Questions for Team Review

1. Should we limit number of labels per thread?
2. Should we have predefined admin tag categories?
3. Should we notify thread owners when admin adds tags?
4. Should we track who added which labels (audit)?
5. Should we allow admins to edit user tags too?

## Estimated Timeline

- **Planning & Review:** 1 day
- **Phase 1 Implementation:** 1 day
- **Phase 2 Implementation:** 1 day
- **Phase 3 Implementation:** 1 day
- **Phase 4 Testing:** 0.5 days
- **Deployment & Monitoring:** 0.5 days

**Total:** ~1 week of focused development