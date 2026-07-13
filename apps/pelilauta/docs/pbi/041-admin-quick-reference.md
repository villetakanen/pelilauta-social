# Admin Thread Labels - Quick Reference Guide

**Feature:** Persistent admin-managed labels for threads  
**Version:** 1.0  
**For:** Forum administrators and moderators

---

## What Are Admin Labels?

Admin labels are **persistent tags** that you (as an admin) can assign to threads. Unlike regular hashtags that users add to their content, admin labels:

- ✅ **Persist through edits** - stay attached even when users edit thread content
- ✅ **Admin-only** - only admins can add or remove them
- ✅ **Visually distinct** - displayed with a border and admin icon
- ✅ **Searchable** - threads appear on tag pages (e.g., `/tags/featured`)

### Common Use Cases

- 🌟 **Featured content** - Highlight exceptional threads
- 📌 **Important** - Mark threads requiring attention
- 🎓 **Resource** - Tag educational/reference content
- 🚀 **Showcase** - Feature community creations
- 🔍 **Needs review** - Flag for moderation
- 📚 **Archive** - Mark historical content

---

## How to Add Labels

### Step 1: Open Admin Tools
1. Navigate to any thread
2. Look for the **ADMIN** accordion in the right sidebar
3. Expand the accordion if collapsed

### Step 2: Add Label
1. Scroll to the **"Admin Labels"** section at the bottom
2. Type the label name in the input field (e.g., "featured")
3. Press **Enter** or click **"Add Label"** button

### Visual Guide
```
┌─────────────────────────────────┐
│ ADMIN                        ▼  │
├─────────────────────────────────┤
│ [Delete Thread Button]          │
│                                 │
│ Move to channel:                │
│ [Channel Selector ▼]            │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Admin Labels                    │
│ Labels are admin-assigned...    │
│                                 │
│ [featured ×] [important ×]      │
│                                 │
│ [Enter label name...] [Add]     │
└─────────────────────────────────┘
```

---

## How to Remove Labels

1. Locate the label in the list under "Admin Labels"
2. Click the **×** button next to the label name
3. Label removed instantly

**Note:** Removing a label does not affect user hashtags.

---

## Label Display

Labels appear in the tag section below the thread title, mixed with user hashtags:

```
Tags:
┌──────────┐ ┌──────────────┐ ┌─────────┐
│ #dnd     │ │ 🛡 featured  │ │ #fantasy│
└──────────┘ └──────────────┘ └─────────┘
   User tag    Admin label       User tag
   (no border)  (has border)     (no border)
```

**Admin labels have:**
- 🛡️ Shield/admin icon prefix
- Border styling
- Hover tooltip: "Admin label"

---

## Label Naming Guidelines

### ✅ Good Label Names
- `featured` - Short, clear, descriptive
- `important` - Single word when possible
- `needs-review` - Use hyphens for multi-word
- `showcase` - Lowercase (automatic)
- `resource` - Generic, reusable

### ❌ Avoid
- `this-is-a-very-long-label-name` - Too long
- `Featured!!!` - Special characters removed, lowercased automatically
- `  featured  ` - Extra spaces trimmed automatically
- Duplicate labels - System prevents these

### Automatic Normalization
All labels are automatically:
- **Lowercased**: "FEATURED" → "featured"
- **Trimmed**: "  featured  " → "featured"
- **Space-collapsed**: "call   of   cthulhu" → "call of cthulhu"

---

## Common Tasks

### Tag Multiple Threads with Same Label
1. Add label "featured" to Thread A
2. Add label "featured" to Thread B
3. Users can browse `/tags/featured` to see both threads

### Create a "Featured Content" Collection
1. Decide on label: "featured"
2. Add to threads as you curate content
3. Share link: `https://pelilauta.net/tags/featured`
4. Users discover curated content

### Flag Threads for Review
1. Add label "needs-review" to problematic threads
2. Browse `/tags/needs-review` for moderation queue
3. Remove label after review complete

### Mark Resources
1. Add label "resource" to guides, references, tools
2. Add label "beginner-guide" to beginner content
3. Users find resources at `/tags/resource`

---

## What Happens When...

### User Edits Thread Content?
- ✅ Admin labels persist unchanged
- ✅ User hashtags update based on new content
- ✅ Both appear together in tag section

### User Adds Conflicting Hashtag?
Example: Admin label "featured" + user adds "#featured"
- ✅ No duplicate - system deduplicates automatically
- ✅ Admin label takes precedence in styling

### All Hashtags Removed from Thread?
- ✅ Admin labels remain visible
- ✅ Thread still appears on label tag pages
- ✅ No errors or issues

### Label Is Removed?
- ✅ Thread removed from that tag page
- ✅ Other labels/tags unaffected
- ✅ User can no longer find thread via that tag

---

## Tag Index & Discovery

### How Users Find Labeled Threads

**Direct URL:**
```
https://pelilauta.net/tags/featured
```

**Search:**
Users can click any label/tag chip to browse all threads with that tag.

**Tag Pages Show:**
- Thread title
- Author
- Excerpt
- All tags (user + admin)

---

## Best Practices

### 🎯 Be Consistent
- Use the same label names across threads
- Don't use both "featured" and "highlight" - pick one
- Create a team label vocabulary

### 📝 Document Your Labels
Keep a list of standard labels:
```
- featured: Exceptional community content
- important: Requires immediate attention
- resource: Educational/reference material
- showcase: Community creations
- needs-review: Flagged for moderation
- archive: Historical/legacy content
```

### 🔄 Regularly Review
- Monthly: Review "featured" threads, update as needed
- Weekly: Check "needs-review" queue
- As needed: Archive outdated content

### 🤝 Coordinate with Team
- Discuss label standards in admin meetings
- Share this guide with new admins
- Update team when adding new label types

### ⚡ Keep It Simple
- Use 1-3 labels per thread (not 20)
- Focus on high-value categorization
- Don't over-label common content

---

## Troubleshooting

### "Label cannot be empty"
**Solution:** Type a label name before clicking "Add Label"

### "Label already exists"
**Solution:** This label is already on the thread. Labels are unique.

### "Failed to add label"
**Causes:**
- Network connection issue
- Session expired
- Server error

**Solution:**
1. Check your internet connection
2. Refresh the page
3. Try again
4. Contact support if persistent

### "Admin tools not visible"
**Causes:**
- Not logged in as admin
- Admin status not synced

**Solution:**
1. Log out and log back in
2. Check with team lead to verify admin status
3. Clear browser cache/cookies

### Label added but not visible on tag page
**Causes:**
- Cache not yet updated (can take 1-2 minutes)

**Solution:**
- Wait a minute
- Hard refresh the tag page (Ctrl+Shift+R / Cmd+Shift+R)
- Check in incognito/private window

---

## Keyboard Shortcuts

- **Tab** - Navigate between input and buttons
- **Enter** - Add label (when input is focused)
- **Space/Enter** - Remove label (when X button is focused)

---

## Technical Details

### Permissions Required
- Admin or moderator role
- Verified account

### API Endpoints
```
POST   /api/threads/{threadKey}/labels
DELETE /api/threads/{threadKey}/labels?labels={label}
```

### Data Storage
- Labels stored in thread document: `thread.labels: string[]`
- Indexed in Firestore tag collection
- Combined with user tags for display

---

## Frequently Asked Questions

### Can users see admin labels?
**Yes** - labels are public and visible to all users in the tag section. The admin icon indicates they're admin-managed.

### Can users remove admin labels?
**No** - only admins can add or remove labels. Users can only modify their own content hashtags.

### Do labels affect thread owner's content?
**No** - labels are separate metadata. Thread owners can edit their content freely without affecting labels.

### How many labels can a thread have?
**No hard limit** - but keep it reasonable (1-5 labels per thread recommended).

### Can I use emoji in labels?
**Technical yes, but not recommended** - stick to alphanumeric and hyphens for best compatibility.

### Do labels affect search/SEO?
**Yes** - labels are indexed and help users discover content via tag pages.

### Can I rename a label?
**No direct rename** - you must remove the old label and add a new one. This affects all threads.

### Can I bulk-add labels to multiple threads?
**Not yet** - currently manual per-thread. Feature request noted for future.

---

## Getting Help

### Documentation
- Full specification: `docs/pbi/041-admin-managed-thread-labels.md`
- Implementation details: `docs/76-01-entry-labels-and-tags.md`
- Testing guide: `docs/pbi/041-manual-testing-guide.md`

### Support
- Report issues via GitHub issue tracker
- Contact dev team in admin Slack channel
- Emergency: [support contact]

---

## Quick Command Reference

```bash
# View all threads with a specific label
https://pelilauta.net/tags/{label-name}

# View thread admin tools
Navigate to thread → Expand ADMIN accordion

# Add label
Type label → Press Enter OR Click "Add Label"

# Remove label
Click × next to label name
```

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-XX  
**Maintained By:** Development Team  
**Related PBI:** PBI-041