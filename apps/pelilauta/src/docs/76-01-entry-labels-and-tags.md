---
name: "Entry Labels and Tags"
shortname: 'Labels & Tags'
noun: 'veil-advance'
---

Content entries (threads, pages, etc.) use two distinct mechanisms for categorization and discovery:

## Tags

**User-controlled keywords automatically extracted from content.**

- Extracted from title and markdown content during processing
- Regenerated when content is edited
- Used for search and filtering on public pages
- Stored in `tags` field (array of strings)

## Labels

**Admin-controlled keywords manually assigned to content.**

- Only moderators/admins can add or remove labels
- Persist through content edits (not regenerated)
- Used for curation, moderation, and editorial organization
- Stored in `labels` field (array of strings)

**Common label use cases:**
- Editorial: `featured`, `spotlight`, `community-pick`
- Moderation: `needs-review`, `reported`, `locked`
- Organization: `beginner-friendly`, `advanced`, `tutorial`
- Events: `event`, `contest`, `announcement`

## Combined Discovery

For content discovery, tags and labels are combined and deduplicated. The `threadTagHelpers` module provides utilities:

- `getAllThreadTags(thread)` - Returns combined, normalized, deduplicated array
- `isLabel(thread, tag)` - Checks if a tag is an admin-assigned label
- `normalizeTag(tag)` - Normalizes tags (lowercase, trim, collapse whitespace)

## Permissions

**Tags:**
- Created/updated by content authors via content editing
- Deleted when content is deleted

**Labels:**
- Created/updated/deleted by admins/moderators only
- API endpoint: `/api/threads/{threadKey}/labels` (POST/DELETE)
- Visible to all users

## Implementation

- Schema: `src/schemas/ThreadSchema.ts`
- Helpers: `src/utils/shared/threadTagHelpers.ts`
- Tests: `test/utils/threadTagHelpers.test.ts`
