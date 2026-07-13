# PBI-43 Merge Verification Plan

**Feature:** Manual Site Table of Contents Ordering
**Branch:** `feat/pbi-43` -> `dev`

## 1. Automated Verification

### Unit Tests
Run the existing unit tests to verify the sorting logic and schema changes.

```bash
pnpm run test
```

**Focus Areas:**
- `test/lib/toc/manualSorting.test.ts`: Verifies sorting logic with/without order fields.
- `src/schemas/SiteSchema.ts`: Verifies `PageRefSchema` accepts `order` field.

### Linting & Build
Ensure code quality and build stability.

```bash
pnpm exec biome check src/
pnpm run build
```

## 2. Manual Verification

### A. Manual TOC Ordering
**Goal:** Verify that site owners can manually reorder pages and the changes persist.

1.  **Setup**:
    -   Log in as a user who owns a site (or create a new site).
    -   Ensure the site has at least 3 pages in the same category (or uncategorized).

2.  **Enable Manual Sorting**:
    -   Navigate to `/sites/{siteKey}/toc/settings`.
    -   Change "Sort Order" dropdown to "Manual".
    -   **Verify:** The drag-and-drop interface appears (list items with drag handles).

3.  **Reorder Pages**:
    -   Drag the last page to the top of the list.
    -   **Verify:** The list updates immediately to reflect the new order.
    -   **Verify:** A "Saving..." indicator or snackbar appears.
    -   **Verify:** A success message ("Table of contents order updated") appears.

4.  **Persistence**:
    -   Refresh the page.
    -   **Verify:** The pages remain in the new custom order.

5.  **TOC Display**:
    -   Navigate to the public TOC page: `/sites/{siteKey}/toc/`.
    -   **Verify:** The pages are displayed in the custom order you set.

6.  **Category Handling**:
    -   If the site has multiple categories, try reordering pages within each category.
    -   **Verify:** Reordering in one category does not affect others.

### B. Login Button State Fix
**Goal:** Verify that the login button correctly reflects the session state.

1.  **Login/Logout Cycle**:
    -   Log out of the application.
    -   **Verify:** The top bar shows "Login" button.
    -   Log in.
    -   **Verify:** The top bar shows the user avatar/menu.
    -   Refresh the page.
    -   **Verify:** The user remains logged in (avatar visible).

2.  **Session Expiry (Simulation)**:
    -   (Optional) Manually clear the session cookie or local storage.
    -   Refresh the page.
    -   **Verify:** The UI updates to show "Login" button (or redirects if on a protected page).

### C. Regression Testing
**Goal:** Ensure existing sort options still work.

1.  **Name Sorting**:
    -   Go to TOC settings.
    -   Change "Sort Order" to "Name".
    -   **Verify:** Pages are sorted alphabetically.
    -   **Verify:** Drag-and-drop interface is hidden.

2.  **Flow Time Sorting**:
    -   Change "Sort Order" to "Updated" (Flow Time).
    -   **Verify:** Pages are sorted by last update time.

## 3. E2E Testing (Recommended)

Consider adding a new E2E test file `e2e/manual-toc-ordering.spec.ts` to automate the manual verification steps.

**Test Scenarios:**
-   Owner can enable manual sort.
-   Owner can drag-and-drop pages.
-   Order persists after reload.
-   Public TOC reflects manual order.
-   Non-owners cannot access settings.
