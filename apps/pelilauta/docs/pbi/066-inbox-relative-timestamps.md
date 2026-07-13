# PBI-066: Inbox Relative Timestamps

## Goal
Display notification timestamps as relative time (e.g., "2 hours ago") instead of raw ISO dates.

## Problem
Inbox notifications show timestamps like `2025-12-30` instead of user-friendly relative times like "5 days ago".

## Root Cause
- [NotificationItem.svelte line 61](file:///src/components/svelte/inbox/NotificationItem.svelte#L61) calls `toDisplayString(notification.createdAt)` without the `relative = true` parameter
- Compare with [ReplyArticle.svelte line 34](file:///src/components/svelte/discussion/ReplyArticle.svelte#L34) which correctly uses relative time on mount

## Solution
Pass `true` as the second argument to enable relative time formatting.

### Changes Required

#### [MODIFY] `src/components/svelte/inbox/NotificationItem.svelte`

**Current (line 61):**
```svelte
{toDisplayString(notification.createdAt)}
```

**New:**
```svelte
{toDisplayString(notification.createdAt, true)}
```

### Optional Enhancement
Consider using `onMount` pattern like `ReplyArticle.svelte` to show static date on SSR and relative time after hydration:

```svelte
<script>
  import { onMount } from 'svelte';
  let displayTime = $state(toDisplayString(notification.createdAt));
  
  onMount(() => {
    displayTime = toDisplayString(notification.createdAt, true);
  });
</script>

{displayTime}
```

## Acceptance Criteria
- [ ] Notification timestamps show relative time (e.g., "2 hours ago", "yesterday")
- [ ] Times older than 72 hours fall back to date format (existing behavior in `toDisplayString`)
- [ ] No flash of content change on hydration (if using onMount pattern)

## Verification
1. Navigate to `/inbox`
2. Verify timestamps show relative format ("X minutes ago", "X hours ago", "yesterday")
3. Verify old notifications (>3 days) show date format

## Out of Scope
- Locale detection (hardcoded to 'fi') — tracked separately as broader i18n work

## References
- Spec: `plans/inbox/spec.md`
