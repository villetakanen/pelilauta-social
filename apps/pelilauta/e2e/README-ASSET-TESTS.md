# E2E Tests for Asset Uploads

This directory contains end-to-end tests for asset upload functionality in the Pelilauta application.

## Overview

Asset uploads are a critical feature that allows users to:
- Upload images, PDFs, and other files to sites
- Upload images to threads and replies
- Manage uploaded assets (view, edit metadata, delete)

These e2e tests ensure the upload pipeline works correctly from UI to Firebase Storage.

## Test Files

### Site Asset Upload Tests (`site-asset-upload.spec.ts`)

Tests for uploading assets to sites:

1. **Image Upload** - Verifies users can upload images to site assets
2. **PDF Upload** - Verifies users can upload PDF documents
3. **File Size Validation** - Tests 10MB file size limit enforcement
4. **File Type Restrictions** - Validates allowed file types (images, PDFs, text files)
5. **Asset Deletion** - Tests removing uploaded assets
6. **Authentication Required** - Verifies anonymous users cannot upload
7. **Ownership Required** - Ensures only site owners can upload
8. **Metadata Tracking** - Verifies asset metadata includes upload info
9. **Theme Image Upload** - Tests using assets in site theme settings
10. **Image Resizing** - Verifies large images are resized before upload

### Thread Asset Upload Tests (`thread-asset-upload.spec.ts`)

Tests for uploading images to threads:

1. **Image Upload on Creation** - Tests adding image when creating thread
2. **Image Upload in Reply** - Tests adding image to existing thread reply
3. **File Type Validation** - Ensures only images allowed (no PDFs/text)
4. **File Size Validation** - Tests 10MB limit for thread images
5. **Authentication Required** - Verifies login required for uploads
6. **Content Preservation** - Ensures markdown content preserved during upload
7. **Image Display** - Verifies uploaded images render in thread content
8. **Error Handling** - Tests graceful handling of upload failures

## Test Fixtures

Test fixtures are located in `playwright/test-fixtures/`:

- `test-image.png` - Standard test image
- `test-delete.png` - Image for deletion tests
- `test-metadata.png` - Image for metadata tests
- `test-theme.png` - Image for theme upload tests
- `test-thread-image.png` - Image for thread creation tests
- `test-reply-image.png` - Image for reply tests
- `test-preserve.png` - Image for content preservation tests
- `test-display.png` - Image for display tests
- `test-large.png` - Large image for resize tests
- `test-document.pdf` - PDF document for site uploads
- `test-invalid.txt` - Invalid file type for error tests

### Generating Fixtures

Test fixtures are minimal PNG files (1x1 pixel) and PDF documents. They're sufficient for testing upload logic without requiring large files.

To regenerate fixtures:

```bash
node playwright/test-fixtures/generate-fixtures.js
```

## Running the Tests

### All Asset Upload Tests

```bash
npm run test:e2e -- site-asset-upload.spec.ts thread-asset-upload.spec.ts
```

### Site Asset Tests Only

```bash
npm run test:e2e -- site-asset-upload.spec.ts
```

### Thread Asset Tests Only

```bash
npm run test:e2e -- thread-asset-upload.spec.ts
```

### With UI (Headed Mode)

```bash
npm run test:e2e -- site-asset-upload.spec.ts --headed
```

### Debug Mode

```bash
npm run test:e2e -- site-asset-upload.spec.ts --debug
```

## Prerequisites

1. **Test Database Initialized**
   ```bash
   node e2e/init-test-db.js
   ```

2. **Development Server Running**
   ```bash
   npm run dev
   ```

3. **Firebase Emulators** (if using emulators)
   ```bash
   firebase emulators:start
   ```

4. **Test User Authenticated**
   - Tests use credentials from `playwright/.auth/credentials.ts`
   - Default test user: `existingUser`

## Test Environment

- **Base URL**: `http://localhost:4321`
- **Test Site**: `e2e-test-site` (created by `init-test-db.js`)
- **Test User**: Existing user with owner permissions on test site

## Implementation Details

### Upload Flow Tested

1. **User Authentication** - User must be logged in
2. **Authorization Check** - User must be site owner (for sites)
3. **File Selection** - File chosen via input or drag-drop
4. **Client-Side Validation**:
   - File size check (10MB limit)
   - File type validation (based on upload context)
   - Image resizing (for large images)
5. **Upload to Firebase Storage**:
   - Unique path generation (UUID-prefixed)
   - Storage upload with progress
6. **Metadata Creation**:
   - URL, storage path, mimetype
   - File size, upload timestamp
   - Uploader user ID
   - Image dimensions (for images)
7. **Firestore Update**:
   - Asset added to site/thread document
   - Real-time update to UI

### Validation Rules

**Site Assets:**
- Allowed types: `image/*`, `application/pdf`, `text/plain`, `text/markdown`
- Max size: 10MB
- Requires: Site ownership

**Thread Assets:**
- Allowed types: `image/*` only
- Max size: 10MB
- Requires: Authentication

### Related Implementation

These tests verify the implementation from **PBI-039 Phase 4**:

- `src/firebase/client/site/addAssetToSite.ts` - Site asset uploads
- `src/firebase/client/threads/addAssetToThread.ts` - Thread image uploads
- `src/utils/client/assetUploadHelpers.ts` - Shared validation/upload utilities
- `src/components/svelte/sites/assets/UploadAssetFab.svelte` - Site upload UI
- `src/schemas/AssetSchema.ts` - Asset metadata schema

## Known Limitations

1. **File Size Testing**: Creating truly large files (>10MB) for size validation tests is skipped to avoid slow tests and large test fixtures.

2. **Visual Verification**: Test fixtures are minimal images (1x1 pixel). Visual verification requires manual testing with real images.

3. **Storage Cleanup**: Deleted assets may leave orphaned files in Firebase Storage (though this is logged and tracked).

4. **Network Conditions**: Tests don't simulate slow networks or upload interruptions.

5. **Browser Compatibility**: Tests run in Chromium by default. Cross-browser testing requires additional configuration.

## Debugging Failed Tests

### Upload Button Not Visible

- Check user authentication: `await waitForAuthState(page, 15000)`
- Verify user is site owner: Check `init-test-db.js` owners array
- Check component rendering: Look for `button:has(cn-icon[noun="assets"])`

### File Upload Fails

- Check file path exists: `playwright/test-fixtures/test-image.png`
- Verify Firebase Storage configured: Check `.env.development`
- Check network logs: Tests log all API responses
- Look for console errors: Tests monitor browser console

### Asset Not Appearing

- Wait longer: `await page.waitForTimeout(3000)`
- Check Firestore update: Verify asset in site/thread document
- Check real-time subscriptions: Authenticated users get live updates

### Permission Errors

- Verify test user permissions: Check `init-test-db.js`
- Check Firebase Security Rules: Ensure test environment allows writes
- Verify authentication state: Look for auth state logs

## Future Enhancements

- [ ] Test drag-and-drop upload
- [ ] Test multiple file upload
- [ ] Test upload progress indicators
- [ ] Test upload cancellation
- [ ] Test upload retry on failure
- [ ] Test very large files (>10MB) rejection
- [ ] Test virus scanning (when implemented)
- [ ] Test upload quotas (when implemented)
- [ ] Test asset sharing/permissions
- [ ] Cross-browser compatibility tests

## Related Documentation

- Main PBI: `docs/pbi/039-dry-asset-metadata-and-upload.md`
- Phase 4 Implementation: `docs/pbi/039-phase4-implementation.md`
- Schema Documentation: `src/schemas/AssetSchema.ts`
- Upload Utilities: `src/utils/client/assetUploadHelpers.ts`

## Maintenance

These tests should be updated when:

- Upload UI components change
- Validation rules change (file types, size limits)
- Asset metadata schema changes
- Firebase Storage paths change
- Authentication/authorization logic changes

Last updated: 2024-01-15 (PBI-039 Phase 4)