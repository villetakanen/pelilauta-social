# PBI-051: User Profile Public Links

**Priority:** Medium
**Type:** Feature Enhancement
**Estimated Effort:** 4-6 hours

**User Story:** As a user, I want to add public links to my profile (e.g. personal blog, itch.io, DTRPG), so that I can showcase my work and presence on other platforms to the community.

## Terminology

- **Public Links**: A list of URLs with optional labels that a user adds to their profile.
- **Profile Tool**: The settings interface where users edit their profile.
- **Profile Section**: The display component showing user info (avatar, bio, etc.).

---

## Problem Statement

Currently, the user profile only supports a bio field. Users often want to share links to their external content (RPGs they've written, specialized blogs, portfolio sites), but currently have to jam these into the `bio` text field, which is not clickable or structured suitable for lists of links.

### Current Behavior

**Data Model:**
```typescript
// src/schemas/ProfileSchema.ts
export const ProfileSchema = z.object({
  key: z.string(),
  username: z.string(),
  nick: z.string(),
  avatarURL: z.string().optional(),
  bio: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lovedThreads: z.array(z.string()).optional(),
});
```

**UI:**
- `ProfileTool.svelte` only has inputs for Avatar and Bio.
- `ProfileSection.svelte` only displays Avatar, Nick, Username, and Bio.

---

## Proposed Solution

Add a structured `links` array to the `Profile` schema. Create a management interface in `ProfileTool` to add/remove these links, and display them nicely in `ProfileSection`.

### Schema Changes

**File:** `src/schemas/ProfileSchema.ts`

Add a new `ProfileLinkSchema` and update `ProfileSchema` to include it.

```typescript
export const ProfileLinkSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(50),
});

export type ProfileLink = z.infer<typeof ProfileLinkSchema>;

export const ProfileSchema = z.object({
  // ... existing fields
  links: z.array(ProfileLinkSchema).optional(),
});
```

**Migration & Backwards Compatibility:**
-   Update `parseProfile` and `migrateProfile` to handle the new `links` field.
-   **Important**: The field must be optional in `ProfileSchema`.
-   **Important**: `migrateProfile` must handle missing `links` on existing documents by defaulting to `[]` or `undefined`.

---

## UX Design & Interaction

### Settings Page (`ProfileTool.svelte`)

**Location**: Inside the "Profiili" card, between the "Kuvaus" (Bio) field and the "Tallenna" (Save) button.

**UI Flow:**
1.  **Header**: Small label "Julkiset linkit" (Public Links).
2.  **Existing Links**: List of chips/cards with "Remove" button.
3.  **Add New**: Inputs for Label/URL + [Add] button.
4.  **Save**: Commits changes to backend.

### Profile Page (`ProfileSection.svelte`)

**Location**: Left Column (Identity Card), immediately below the Bio.

**Visual Formatting**:
The Left Column is centered text on a dark background. The links should follow this vertical rhythm.

**Design:**
-   **Vertical Stack**: Links are listed one per line.
-   **Style**: Text links with a distinct color (Cyan accent) or subtle button styling to encourage clicking.
-   **Iconography**: Each link should have a small "external link" icon (trailing or leading) to indicate it leaves the site.
-   **Spacing**: Add a visual separator (margin or small HR) between the Bio and the Links to distinguish "About Me" text from "My Content" links.

**Mockup (Layout):**
```
      [ Avatar ]
    Ville Takanen
   @villetakanen...
   
   "Tämän sovelluksen..."
   (Bio text centered)
   
        ---
   
   [ Icon ] Kotisivu
   [ Icon ] Itch.io
   [ Icon ] LinkedIn
```

**Interaction**:
-   Hover effects: Underline or slight brightness increase to indicate interactivity.
-   Target: Opens in new tab (`target="_blank"`).

---

## Implementation Plan

### Phase 1: Foundation (Schema & Data)

1.  **Update Schema** (`src/schemas/ProfileSchema.ts`):
    -   Add `ProfileLinkSchema`.
    -   Add `links` to `ProfileSchema`.
    -   Update `migrateProfile`.
2.  **Verify Compatibility**: Create unit tests in `test/schemas/ProfileSchema.test.ts` (or equivalent).

### Phase 2: Logic & Validation

1.  **E2E Tests**: Scaffold `e2e/profile-links.spec.ts`.
2.  **Validation Logic**: Ensure strict URL validation.

### Phase 3: Settings UI (The "Control Panel")

1.  **Update `ProfileTool.svelte`**:
    -   Add state: `links` (array), `newLabel` (string), `newUrl` (string).
    -   Implement `addLink()`: pushes to `links`, clears inputs.
    -   Implement `removeLink(index)`: splices `links`.
    -   **Key UX**: Only enable generic "Save" button if `links` array differs from initial profile data.

### Phase 4: Public Display

1.  **Update `ProfileSection.svelte`**:
    -   Receive `profile` prop.
    -   Check for `profile.links`.
    -   Render container `<nav class="flex flex-col gap-1 mt-2 items-center w-full">`.
    -   Render items:
        ```html
        <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-styled flex items-center gap-1">
          {link.label}
          <cn-icon noun="external" class="small"></cn-icon>
        </a>
        ```

---

## Testing Strategy

### Unit Tests (Phase 1)
**File:** `src/schemas/ProfileSchema.test.ts` (create if missing)

1.  **Backwards Compatibility**:
    -   Input: Plain profile object *without* `links`.
    -   Operation: `ProfileSchema.parse(input)`.
    -   Expect: Success, `links` is undefined.
    -   Operation: `migrateProfile(input, 'key')`.
    -   Expect: Success, `links` is present in output (optional).

2.  **Forward Compatibility**:
    -   Input: Profile object *with* `links`: `[{ url: 'https://a.com', label: 'A' }]`.
    -   Operation: `ProfileSchema.parse(input)`.
    -   Expect: Success, data preserved.

3.  **Validation**:
    -   Input: Profile with invalid URL `htps://bad`.
    -   Expect: Parse error.

### E2E Tests (Phase 2 & 4)
**File:** `e2e/profile-links.spec.ts`

```typescript
import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

test.describe('Profile Links', () => {
  test('User can add and view public links', async ({ page }) => {
    // 1. Authenticate
    await authenticate(page);
    
    // 2. Navigate to Settings
    await page.goto('/settings');
    
    // 3. Add Link
    // Note: Selectors depend on final implementation
    await page.getByPlaceholder('Otsikko').fill('My Blog');
    await page.getByPlaceholder('https://').fill('https://example.com');
    await page.getByRole('button', { name: 'Lisää' }).click();
    
    // 4. Save Profile
    await page.getByRole('button', { name: 'Tallenna' }).click();
    
    // 5. Verify on Profile Page
    await page.goto('/profile/me'); // Or resolve UID
    const link = page.getByRole('link', { name: 'My Blog' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://example.com');
    
    // 6. Cleanup (Remove Link)
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Poista' }).first().click(); // Icon button
    await page.getByRole('button', { name: 'Tallenna' }).click();
  });
});
```

---

## Acceptance Criteria

### Functional
- [ ] Existing profiles load safely.
- [ ] In Settings, user sees list of current links.
- [ ] User can add a link (Label + URL) - requires pressing "Add".
- [ ] User can remove a link from the list.
- [ ] "Save" persists the new list to Firestore.
- [ ] Profile page displays the links in the left column, below the bio.

### Non-Functional
- [ ] UI fits comfortable in the narrow profile column (mobile friendly).
- [ ] URLs are validated.
