# PBI-039: DRY Asset Metadata and Upload Functionality

**Status:** Ready for Development  
**Priority:** Medium  
**Estimated Effort:** 10-14 hours  
**Labels:** `refactoring`, `assets`, `technical-debt`, `site-assets`, `licensing`, `backwards-compatible`

**Note:** All changes maintain data backwards-compatibility. Phase 4 involves internal API signature changes only (not a conventional-commits BREAKING CHANGE).

## User Story

As a developer maintaining the asset upload functionality, I want the asset metadata schema and upload patterns to be consistent and DRY across the codebase, so that future changes are easier to implement and bugs are less likely to occur.

## Problem Statement

The current asset upload implementation has several inconsistencies and areas where code is duplicated or could be more maintainable:

### 1. **License Constants Should Be Shared**

License keys are currently defined in `AssetSchema.ts`, but licenses apply to both content (sites, pages) and assets. This creates:
- Duplication if we need licenses elsewhere
- Inconsistency risk if definitions diverge
- Coupling between asset code and licensing logic

```typescript
// Current: Defined in AssetSchema.ts
export const ASSET_LICENSES = z.enum(['0', 'cc-by', 'cc-by-sa', ...]);
export const ASSET_LICENSES_KEYS = ['0', 'cc-by', 'cc-by-sa', ...];
```

**Issues:**
- Site schema has `license: z.string().optional()` without using these constants
- No shared TypeScript type for license keys
- No helper functions for license validation or i18n key generation
- License translations in `site:license.*` but no code connection

### 2. **Inconsistent Metadata Schema**

Current `AssetSchema` is minimal and lacks important tracking fields:

```typescript
// src/schemas/AssetSchema.ts
export const AssetSchema = z.object({
  url: z.string(),                    // Download URL
  description: z.string().default(''),
  license: z.string().default('0'),
  name: z.string().default(''),
  mimetype: z.string().optional(),    // Missing from some flows
  storagePath: z.string().optional(), // Missing from some flows
});
```

**Missing fields that would be valuable:**
- `uploadedAt`: Timestamp for when asset was created
- `uploadedBy`: User ID who uploaded the asset
- `size`: File size in bytes
- `width`/`height`: Image dimensions (for images)

### 3. **Duplicated Upload Logic**

Three separate upload functions with similar patterns:

**Sites:** `addAssetToSite(site, file, metadata)`
- Uploads to Storage: `Sites/{siteKey}/{uuid}-{filename}`
- Updates Firestore: Adds asset to `site.assets[]` array
- Returns: `downloadURL` string

**Threads:** `addAssetToThread(threadKey, file)`
- Uploads to Storage: `Threads/{threadKey}/{uuid}-{filename}`
- Does NOT update Firestore (caller's responsibility)
- Returns: `{ downloadURL, storagePath }` object

**Profiles:** `uploadAvatar(file)` *(not examined in detail)*
- Different pattern again

**Issues:**
- File size validation duplicated in multiple places
- Image resizing logic duplicated
- UUID generation duplicated
- Storage path construction inconsistent
- Error handling patterns differ

### 4. **Inconsistent Validation**

File size checks are hardcoded in UI components:

```svelte
// UploadAssetFab.svelte
if (resizedFile.size > 10 * 1024 * 1024) {
  throw new Error('File is too big');
}

// SiteThemeImageInput.svelte
// No size validation at all!
```

### 5. **Missing Storage Path in Some Flows**

`SiteThemeImageInput.svelte` doesn't pass metadata explicitly:
```typescript
const url = await addAssetToSite(site, f, {}); // Empty metadata object
```

This means `storagePath` might not always be captured, making cleanup difficult.

### 6. **No Asset Cleanup Strategy**

Currently, there's no mechanism to:
- Delete orphaned assets from Storage when removed from Firestore
- Find unused assets across the system
- Track asset usage

## Technical Details

### Current File Structure

```
src/
├── schemas/
│   └── AssetSchema.ts              # Schema definition
├── firebase/client/
│   ├── site/
│   │   ├── addAssetToSite.ts       # Site uploads + Firestore update
│   │   ├── updateSiteAsset.ts      # Update metadata only
│   │   └── deleteSiteFromAssets.ts # Delete asset
│   ├── threads/
│   │   └── addAssetToThread.ts     # Thread uploads (no Firestore)
│   └── profile/
│       └── uploadAvatar.ts          # Profile uploads
└── components/svelte/sites/
    ├── assets/
    │   ├── UploadAssetFab.svelte          # Generic asset upload UI
    │   ├── AssetEditor.svelte             # Edit existing asset
    │   └── AssetMetadataForm.svelte       # Metadata editing form
    └── settings/
        └── SiteThemeImageInput.svelte     # Theme image uploader
```

### Proposed Improvements

#### A. Create Shared License Constants

**New File:** `src/schemas/LicenseSchema.ts`

```typescript
import { z } from 'zod';

/**
 * Shared license constants for content and assets.
 *
 * These licenses are used across:
 * - Site metadata (SiteSchema)
 * - Asset metadata (AssetSchema)
 * - Any other content that needs licensing information
 *
 * License translations are available in i18n files under `site:license.*`
 */

/**
 * Available license keys as a const array for TypeScript literal types
 */
export const LICENSE_KEYS = [
  '0',              // All rights reserved (default, no license)
  'cc-by',          // Creative Commons Attribution 4.0
  'cc-by-sa',       // Creative Commons Attribution-ShareAlike 4.0
  'cc-by-nc',       // Creative Commons Attribution-NonCommercial 4.0
  'cc-by-nc-sa',    // Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  'cc0',            // Creative Commons Zero (Public Domain Dedication)
  'public-domain',  // Public Domain
  'OGL',            // Open Game License (for RPG content)
] as const;

/**
 * Zod enum for license validation in schemas
 */
export const LicenseSchema = z.enum([
  '0',
  'cc-by',
  'cc-by-sa',
  'cc-by-nc',
  'cc-by-nc-sa',
  'cc0',
  'public-domain',
  'OGL',
]).default('0');

/**
 * TypeScript type for license keys
 */
export type LicenseKey = typeof LICENSE_KEYS[number];

/**
 * Helper to check if a string is a valid license key
 */
export function isValidLicense(license: string): license is LicenseKey {
  return LICENSE_KEYS.includes(license as LicenseKey);
}

/**
 * Helper to get the i18n key for a license
 * Use with t() function: t(getLicenseI18nKey('cc-by'))
 */
export function getLicenseI18nKey(license: LicenseKey): string {
  return `site:license.${license}`;
}

/**
 * Helper to get the license link i18n key (if available)
 * Returns undefined for licenses without standard links
 */
export function getLicenseLinkI18nKey(license: LicenseKey): string | undefined {
  const licensesWithLinks: LicenseKey[] = [
    'cc-by',
    'cc-by-sa',
    'cc-by-nc',
    'cc-by-nc-sa',
    'cc0',
  ];

  if (licensesWithLinks.includes(license)) {
    return `site:license.links.${license}`;
  }

  return undefined;
}
```

#### B. Update AssetSchema to Use Shared License Constants

**File:** `src/schemas/AssetSchema.ts`

```typescript
import { logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { LICENSE_KEYS, LicenseSchema } from './LicenseSchema';

export const ASSETS_COLLECTION_NAME = 'assets';

/**
 * @deprecated Use LICENSE_KEYS from LicenseSchema instead
 * Kept for backward compatibility during migration
 */
export const ASSET_LICENSES_KEYS = LICENSE_KEYS;

/**
 * @deprecated Use LicenseSchema from LicenseSchema instead
 * Kept for backward compatibility during migration
 */
export const ASSET_LICENSES = LicenseSchema;

export const AssetSchema = z.object({
  url: z.string(),
  description: z.string().default(''),
  license: z.string().default('0'),
  name: z.string().default(''),
  mimetype: z.string().optional(),
  storagePath: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export function parseAsset(data: Record<string, unknown>): Asset {
  try {
    return AssetSchema.parse({
      ...data,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      logError('AssetSchema parse error:', err.issues);
    }
    throw err;
  }
}
```

#### C. Enhance AssetSchema with Additional Metadata

**File:** `src/schemas/AssetSchema.ts`

```typescript
import { logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { LICENSE_KEYS, LicenseSchema } from './LicenseSchema';

export const ASSETS_COLLECTION_NAME = 'assets';

/**
 * @deprecated Use LICENSE_KEYS from LicenseSchema instead
 */
export const ASSET_LICENSES_KEYS = LICENSE_KEYS;

/**
 * @deprecated Use LicenseSchema from LicenseSchema instead
 */
export const ASSET_LICENSES = LicenseSchema;

// Enhanced schema with tracking metadata
export const AssetSchema = z.object({
  url: z.string(),                      // Download URL (required)
  storagePath: z.string(),              // Full Storage path (required for cleanup)
  name: z.string().default(''),        // Display name
  description: z.string().default(''), // User description
  license: z.string().default('0'),    // License key
  mimetype: z.string(),                // e.g., 'image/webp', 'application/pdf'
  size: z.number(),                    // File size in bytes
  uploadedAt: z.string(),              // ISO timestamp
  uploadedBy: z.string(),              // User ID
  
  // Optional image-specific metadata
  width: z.number().optional(),        // Image width in pixels
  height: z.number().optional(),       // Image height in pixels
});

export type Asset = z.infer<typeof AssetSchema>;

export function parseAsset(data: Record<string, unknown>): Asset {
  try {
    return AssetSchema.parse({
      ...data,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      logError('AssetSchema parse error:', err.issues);
    }
    throw err;
  }
}

// Helper to create minimal asset metadata (backward compatibility)
export function createAssetMetadata(
  url: string,
  storagePath: string,
  file: File,
  uploadedBy: string,
  additionalData?: Partial<Asset>
): Asset {
  return parseAsset({
    url,
    storagePath,
    name: additionalData?.name || file.name,
    description: additionalData?.description || '',
    license: additionalData?.license || '0',
    mimetype: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    width: additionalData?.width,
    height: additionalData?.height,
  });
}
```

**Migration Strategy:**
- New fields are required in schema but will be backfilled with defaults for existing data
- `parseAsset` will use `.catch()` with defaults during migration period
- Add Firestore migration script to backfill existing assets

#### D. Create Shared Upload Utilities

**New File:** `src/utils/client/assetUploadHelpers.ts`

```typescript
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { app } from 'src/firebase/client';
import { logDebug, logError } from 'src/utils/logHelpers';
import { v4 as uuidv4 } from 'uuid';

export const ASSET_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB default

export interface StorageUploadResult {
  downloadURL: string;
  storagePath: string;
}

/**
 * Validates file size against a maximum limit
 * @throws Error if file exceeds size limit
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = ASSET_MAX_SIZE_BYTES
): void {
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`
    );
  }
}

/**
 * Validates file type against allowed patterns
 * @throws Error if file type is not allowed
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): void {
  const isAllowed = allowedTypes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === pattern;
  });

  if (!isAllowed) {
    throw new Error(
      `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

/**
 * Generates a unique storage path for an asset
 */
export function generateStoragePath(
  category: 'Sites' | 'Threads' | 'Profiles',
  categoryId: string,
  filename: string
): string {
  const uniqueFilename = `${uuidv4()}-${filename}`;
  return `${category}/${categoryId}/${uniqueFilename}`;
}

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * This is a low-level utility - use specific upload functions for business logic
 */
export async function uploadToStorage(
  file: File,
  storagePath: string
): Promise<StorageUploadResult> {
  const { getStorage } = await import('firebase/storage');
  const storage = getStorage(app);
  const storageRef = ref(storage, storagePath);

  try {
    logDebug('uploadToStorage', `Uploading to: ${storagePath}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    logDebug('uploadToStorage', `Upload successful: ${downloadURL}`);
    
    return { downloadURL, storagePath };
  } catch (error) {
    logError('uploadToStorage', 'Upload failed:', error);
    throw error;
  }
}

/**
 * Gets image dimensions from a File object
 * Returns undefined if file is not an image or dimensions cannot be determined
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(undefined);
    };

    img.src = objectUrl;
  });
}
```

#### E. Refactor `addAssetToSite` to Use Shared Utilities

**File:** `src/firebase/client/site/addAssetToSite.ts`

```typescript
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createAssetMetadata, type Asset } from 'src/schemas/AssetSchema';
import {
  parseSite,
  SITES_COLLECTION_NAME,
  type Site,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { db } from '..';
import {
  generateStoragePath,
  getImageDimensions,
  uploadToStorage,
  validateFileSize,
  validateFileType,
} from 'src/utils/client/assetUploadHelpers';

// Allowed file types for site assets
const SITE_ASSET_ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

/**
 * Adds an asset to a site's asset collection
 * 
 * @param site - The site to add the asset to
 * @param file - The file to upload
 * @param uploadedBy - User ID of the uploader
 * @param metadata - Optional additional metadata (name, description, license)
 * @returns The download URL of the uploaded asset
 * @throws Error if site doesn't exist, file validation fails, or upload fails
 */
export async function addAssetToSite(
  site: Site,
  file: File,
  uploadedBy: string,
  metadata: Partial<Pick<Asset, 'name' | 'description' | 'license'>> = {}
): Promise<string> {
  // Validate file
  validateFileType(file, SITE_ASSET_ALLOWED_TYPES);
  validateFileSize(file);

  // Get site document
  const siteRef = doc(db, SITES_COLLECTION_NAME, site.key);
  const siteDoc = await getDoc(siteRef);

  if (!siteDoc.exists()) {
    throw new Error(`Site with key ${site.key} not found`);
  }

  // Upload to storage
  const storagePath = generateStoragePath('Sites', site.key, file.name);
  const { downloadURL } = await uploadToStorage(file, storagePath);

  // Get image dimensions if applicable
  const dimensions = await getImageDimensions(file);

  // Create asset metadata
  const assetData = createAssetMetadata(
    downloadURL,
    storagePath,
    file,
    uploadedBy,
    {
      ...metadata,
      ...dimensions,
    }
  );

  // Update site's assets array
  const remoteSite = parseSite(toClientEntry(siteDoc.data()), site.key);
  const assets = remoteSite.assets || [];
  assets.push(assetData);

  // Raw update to site, no need to update metadata fields
  await updateDoc(siteRef, { assets });

  return downloadURL;
}
```

#### F. Refactor `addAssetToThread` to Use Shared Utilities

**File:** `src/firebase/client/threads/addAssetToThread.ts`

```typescript
import { logError } from 'src/utils/logHelpers';
import {
  generateStoragePath,
  uploadToStorage,
  validateFileSize,
  validateFileType,
  type StorageUploadResult,
} from 'src/utils/client/assetUploadHelpers';

const THREAD_ASSET_ALLOWED_TYPES = ['image/*'];

/**
 * Uploads an image asset to a thread's storage location
 * Note: This function does NOT update Firestore - caller is responsible for that
 * 
 * @param threadKey - The thread key
 * @param file - The image file to upload
 * @returns Object containing downloadURL and storagePath
 * @throws Error if file is not an image or upload fails
 */
export async function addAssetToThread(
  threadKey: string,
  file: File
): Promise<StorageUploadResult> {
  if (!threadKey || !file || !file.name) {
    throw new Error('Invalid thread or file provided, aborting asset upload');
  }

  // Validate file type (images only for threads)
  validateFileType(file, THREAD_ASSET_ALLOWED_TYPES);
  validateFileSize(file);

  // Upload to storage
  const storagePath = generateStoragePath('Threads', threadKey, file.name);
  
  try {
    return await uploadToStorage(file, storagePath);
  } catch (error) {
    logError('addAssetToThread', 'Upload failed:', error);
    throw error;
  }
}
```

#### G. Update Components to Pass `uploadedBy`

All upload components need to pass the `uploadedBy` parameter:

**File:** `src/components/svelte/sites/assets/UploadAssetFab.svelte`

```svelte
<script lang="ts">
import { addAssetToSite } from 'src/firebase/client/site/addAssetToSite';
import type { Site } from 'src/schemas/SiteSchema';
import { resizeImage } from 'src/utils/client/resizeImage';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logWarn } from 'src/utils/logHelpers';
import { uid } from '../../../../stores/session';

interface Props {
  site: Site;
}

const { site }: Props = $props();

async function uploadFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  if (!$uid) {
    logWarn('UploadAssetFab', 'Cannot upload: user not authenticated');
    return;
  }

  for (const file of Array.from(files)) {
    try {
      let fileToUpload = file;

      // Resize images before upload
      if (file.type.startsWith('image/')) {
        fileToUpload = await resizeImage(file);
      }

      // Upload with user ID
      await addAssetToSite(site, fileToUpload, $uid);
      pushSnack(t('site:assets.upload.success', { file: file.name }));
    } catch (error) {
      logWarn('UploadAssetFab', `Failed to upload ${file.name}:`, error);
      pushSnack(t('site:assets.upload.error', { file: file.name }));
    }
  }
}
</script>

<!-- UI markup remains the same -->
```

**File:** `src/components/svelte/sites/settings/SiteThemeImageInput.svelte`

Similar changes - add `$uid` check and pass to `addAssetToSite()`.

#### H. Add Asset Deletion with Storage Cleanup

**File:** `src/firebase/client/site/deleteSiteAsset.ts`

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { app, db } from 'src/firebase/client';
import { type Asset } from 'src/schemas/AssetSchema';
import { SITES_COLLECTION_NAME, type Site } from 'src/schemas/SiteSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';

/**
 * Deletes an asset from a site's collection and from Firebase Storage
 * 
 * @param site - The site containing the asset
 * @param asset - The asset to delete
 * @throws Error if asset doesn't exist in site or Firestore update fails
 */
export async function deleteSiteAsset(
  site: Site,
  asset: Asset
): Promise<void> {
  if (!site.assets) {
    throw new Error('Site does not have any assets');
  }

  // Remove asset from Firestore
  const assets = site.assets.filter(a => a.storagePath !== asset.storagePath);
  
  await updateDoc(doc(db, SITES_COLLECTION_NAME, site.key), { assets });
  
  logDebug('deleteSiteAsset', `Removed asset from Firestore: ${asset.storagePath}`);

  // Delete from Storage (best effort - don't fail if Storage delete fails)
  if (asset.storagePath) {
    try {
      const { getStorage } = await import('firebase/storage');
      const storage = getStorage(app);
      const storageRef = ref(storage, asset.storagePath);
      
      await deleteObject(storageRef);
      logDebug('deleteSiteAsset', `Deleted from Storage: ${asset.storagePath}`);
    } catch (error) {
      // Log warning but don't throw - asset is already removed from Firestore
      logWarn('deleteSiteAsset', `Failed to delete from Storage: ${asset.storagePath}`, error);
    }
  }
}
```

## Acceptance Criteria

### License Schema (New)
- [ ] `LicenseSchema.ts` created with shared license constants
- [ ] `LICENSE_KEYS` array exported with all license keys
- [ ] `LicenseSchema` zod enum exported for validation
- [ ] `LicenseKey` TypeScript type exported
- [ ] `isValidLicense()` helper function implemented
- [ ] `getLicenseI18nKey()` helper function implemented
- [ ] `getLicenseLinkI18nKey()` helper function implemented
- [ ] All existing license translations work with new schema

### Schema Changes
- [ ] `AssetSchema` imports from `LicenseSchema` instead of defining own constants
- [ ] `ASSET_LICENSES_KEYS` and `ASSET_LICENSES` marked as deprecated but functional
- [ ] `AssetSchema` includes new required fields: `size`, `uploadedAt`, `uploadedBy`, `mimetype`, `storagePath`
- [ ] `AssetSchema` includes optional fields: `width`, `height` (for images)
- [ ] `createAssetMetadata()` helper function exists and is used consistently
- [ ] Schema validation includes proper error messages

### Shared Utilities
- [ ] `assetUploadHelpers.ts` created with reusable functions:
  - `validateFileSize()`
  - `validateFileType()`
  - `generateStoragePath()`
  - `uploadToStorage()`
  - `getImageDimensions()`
- [ ] All validation logic uses shared utilities (no duplication)
- [ ] Constants like `ASSET_MAX_SIZE_BYTES` are centralized

### Refactored Upload Functions
- [ ] `addAssetToSite()` refactored to use shared utilities
- [ ] `addAssetToSite()` requires `uploadedBy` parameter
- [ ] `addAssetToSite()` captures image dimensions when applicable
- [ ] `addAssetToThread()` refactored to use shared utilities
- [ ] Consistent error handling across all upload functions

### UI Components
- [ ] `UploadAssetFab.svelte` passes `$uid` to upload function
- [ ] `SiteThemeImageInput.svelte` passes `$uid` to upload function
- [ ] Components check for authenticated user before upload
- [ ] Error messages are user-friendly and localized
- [ ] File size validation happens before upload attempt

### Asset Deletion
- [ ] `deleteSiteAsset()` removes asset from both Firestore and Storage
- [ ] Storage deletion failures are logged but don't throw errors
- [ ] Deletion UI updated to use new function

### Testing
- [ ] Unit tests for validation functions
- [ ] Unit tests for `createAssetMetadata()`
- [ ] Integration test for full upload flow
- [ ] Test backward compatibility with existing assets

### Documentation
- [ ] Code comments explain when to use each function
- [ ] JSDoc comments on all public functions
- [ ] Migration notes for breaking changes
- [ ] Documentation updated to reference shared `LicenseSchema`

### Component Updates
- [ ] All components importing `ASSET_LICENSES_KEYS` continue to work (backward compat)
- [ ] Components can optionally migrate to `LICENSE_KEYS` from `LicenseSchema`
- [ ] License validation in forms uses `isValidLicense()` helper
- [ ] License display in UI uses `getLicenseI18nKey()` helper
</parameter>

<old_text line=666>
### Phase 1: Add New Schema Fields (Non-breaking)
1. Update `AssetSchema` to make new fields optional with defaults
2. Deploy schema changes
3. Existing data continues to work

## Migration Plan

### Phase 1: Create Shared License Schema (Non-breaking) ✅ COMPLETE
1. ✅ Create `LicenseSchema.ts` with shared constants
2. ✅ Update `AssetSchema.ts` to re-export for backward compatibility
3. ✅ Deploy - all existing imports continue to work
4. ✅ Update component imports gradually (optional during this phase)

**Status:** Complete - See implementation in `src/schemas/LicenseSchema.ts`

### Phase 2: Add New Asset Metadata Fields (Non-breaking) ✅ COMPLETE
1. ✅ Update `AssetSchema` to make new fields optional with defaults
2. ✅ Add `createAssetMetadata()` helper function
3. ✅ Create comprehensive test suite (18 tests)
4. ✅ Deploy schema changes
5. ✅ Existing data continues to work

**Status:** Complete - See `docs/pbi/039-phase2-implementation.md` for details

### Phase 3: Add Shared Upload Utilities ✅ COMPLETE
1. ✅ Create `assetUploadHelpers.ts` with validation functions
2. ✅ Add `validateFileSize()` and `validateFileType()` functions
3. ✅ Add `generateStoragePath()` function
4. ✅ Add `uploadToStorage()` function
5. ✅ Add `getImageDimensions()` function
6. ✅ Create comprehensive test suite (34 tests)
7. ✅ No breaking changes

**Status:** Complete - See `docs/pbi/039-phase3-implementation.md` for details

### Phase 4: Update Upload Functions (Internal API Refactor) ✅ COMPLETE
1. ✅ Update `addAssetToSite()` signature (internal API change)
2. ✅ Update `addAssetToThread()` to use utilities
3. ✅ Update all call sites to pass `uploadedBy` (2 components)
4. ✅ Update `deleteSiteAsset()` to match spec
5. ✅ All tests pass (297 tests)
6. ✅ Build succeeds with no errors

**Status:** Complete - See `docs/pbi/039-phase4-implementation.md` for details

### Phase 5: Make Schema Fields Required ⏳ NEXT
1. Run Firestore migration to backfill missing fields on existing assets
2. Update schema to make fields required
3. Deploy

**Requires:** Phase 4 completion + production data migration

### Phase 6: Cleanup ⏳ FUTURE
1. Remove deprecated `ASSET_LICENSES` and `ASSET_LICENSES_KEYS` exports
2. Update all imports to use `LicenseSchema` directly
3. Remove old duplicated validation code
4. Update tests
5. Update documentation

**Requires:** All components migrated to new imports

## Testing Strategy

### Unit Tests

**File:** `src/utils/client/assetUploadHelpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateFileType,
  generateStoragePath,
  ASSET_MAX_SIZE_BYTES,
} from './assetUploadHelpers';

describe('validateFileSize', () => {
  it('should pass for files under limit', () => {
    const file = new File(['a'.repeat(1000)], 'test.txt');
    expect(() => validateFileSize(file)).not.toThrow();
  });

  it('should throw for files over limit', () => {
    const file = new File(['a'.repeat(ASSET_MAX_SIZE_BYTES + 1)], 'test.txt');
    expect(() => validateFileSize(file)).toThrow(/exceeds maximum/);
  });

  it('should accept custom size limits', () => {
    const file = new File(['a'.repeat(2000)], 'test.txt');
    expect(() => validateFileSize(file, 1000)).toThrow();
    expect(() => validateFileSize(file, 3000)).not.toThrow();
  });
});

describe('validateFileType', () => {
  it('should accept exact mimetype matches', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(() => validateFileType(file, ['image/png'])).not.toThrow();
  });

  it('should accept wildcard patterns', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(() => validateFileType(file, ['image/*'])).not.toThrow();
  });

  it('should reject non-matching types', () => {
    const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
    expect(() => validateFileType(file, ['image/*'])).toThrow(/not allowed/);
  });
});

describe('generateStoragePath', () => {
  it('should generate valid storage paths', () => {
    const path = generateStoragePath('Sites', 'site123', 'image.png');
    expect(path).toMatch(/^Sites\/site123\/[a-f0-9-]+-image\.png$/);
  });

  it('should include UUID in filename', () => {
    const path1 = generateStoragePath('Sites', 'site123', 'test.png');
    const path2 = generateStoragePath('Sites', 'site123', 'test.png');
    expect(path1).not.toBe(path2); // Should be unique
  });
});
```

**File:** `src/schemas/LicenseSchema.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  LICENSE_KEYS,
  isValidLicense,
  getLicenseI18nKey,
  getLicenseLinkI18nKey,
} from './LicenseSchema';

describe('isValidLicense', () => {
  it('should accept valid license keys', () => {
    expect(isValidLicense('0')).toBe(true);
    expect(isValidLicense('cc-by')).toBe(true);
    expect(isValidLicense('OGL')).toBe(true);
  });

  it('should reject invalid license keys', () => {
    expect(isValidLicense('invalid')).toBe(false);
    expect(isValidLicense('CC-BY')).toBe(false); // Case sensitive
    expect(isValidLicense('')).toBe(false);
  });
});

describe('getLicenseI18nKey', () => {
  it('should generate correct i18n keys', () => {
    expect(getLicenseI18nKey('cc-by')).toBe('site:license.cc-by');
    expect(getLicenseI18nKey('0')).toBe('site:license.0');
  });
});

describe('getLicenseLinkI18nKey', () => {
  it('should return link key for CC licenses', () => {
    expect(getLicenseLinkI18nKey('cc-by')).toBe('site:license.links.cc-by');
    expect(getLicenseLinkI18nKey('cc0')).toBe('site:license.links.cc0');
  });

  it('should return undefined for licenses without links', () => {
    expect(getLicenseLinkI18nKey('0')).toBeUndefined();
    expect(getLicenseLinkI18nKey('OGL')).toBeUndefined();
    expect(getLicenseLinkI18nKey('public-domain')).toBeUndefined();
  });
});
```
</parameter>

<old_text line=789>
});
```

### Integration Tests

**File:** `e2e/site-asset-upload.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Site Asset Upload', () => {
  test('should upload image asset with metadata', async ({ page }) => {
    await page.goto('/sites/test-site/assets');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./fixtures/test-image.png');
    
    // Wait for success
    await expect(page.locator('.snackbar')).toContainText('success');
    
    // Verify asset appears in list
    await expect(page.locator('[data-testid="asset-list"]'))
      .toContainText('test-image.png');
  });

  test('should reject oversized files', async ({ page }) => {
    await page.goto('/sites/test-site/assets');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./fixtures/large-file.bin'); // > 10MB
    
    await expect(page.locator('.snackbar')).toContainText('exceeds maximum');
  });
});
```

## Migration Examples

### Example 1: Component Using License Keys (Backward Compatible)

**Before:**
```svelte
<script lang="ts">
import { ASSET_LICENSES_KEYS } from 'src/schemas/AssetSchema';
import { t } from 'src/utils/i18n';

const licenses = ASSET_LICENSES_KEYS;
</script>

<select>
  {#each licenses as license}
    <option value={license}>{t(`site:license.${license}`)}</option>
  {/each}
</select>
```

**After (Recommended):**
```svelte
<script lang="ts">
import { LICENSE_KEYS, getLicenseI18nKey } from 'src/schemas/LicenseSchema';
import { t } from 'src/utils/i18n';

const licenses = LICENSE_KEYS;
</script>

<select>
  {#each licenses as license}
    <option value={license}>{t(getLicenseI18nKey(license))}</option>
  {/each}
</select>
```

**Note:** The old import still works due to re-export, but the new approach is preferred.

### Example 2: License Validation

**Before:**
```typescript
import { ASSET_LICENSES_KEYS } from '@schemas/AssetSchema';

function setLicense(value: string) {
  if (value && ASSET_LICENSES_KEYS.indexOf(value) === -1) {
    logError('Invalid license value:', value);
    return;
  }
  // ... rest of logic
}
```

**After (Recommended):**
```typescript
import { isValidLicense } from '@schemas/LicenseSchema';

function setLicense(value: string) {
  if (value && !isValidLicense(value)) {
    logError('Invalid license value:', value);
    return;
  }
  // ... rest of logic
}
```

### Example 3: Displaying License with Link

**Before:**
```svelte
<script lang="ts">
import { t } from 'src/utils/i18n';

const license = 'cc-by';
const licenseText = t(`site:license.${license}`);
const licenseLink = t(`site:license.links.${license}`);
</script>

<a href={licenseLink}>{licenseText}</a>
```

**After (Recommended):**
```svelte
<script lang="ts">
import { getLicenseI18nKey, getLicenseLinkI18nKey } from 'src/schemas/LicenseSchema';
import { t } from 'src/utils/i18n';

const license = 'cc-by';
const licenseText = t(getLicenseI18nKey(license));
const linkKey = getLicenseLinkI18nKey(license);
const licenseLink = linkKey ? t(linkKey) : undefined;
</script>

{#if licenseLink}
  <a href={licenseLink}>{licenseText}</a>
{:else}
  <span>{licenseText}</span>
{/if}
```

### Example 4: Using LicenseKey Type

**Before:**
```typescript
interface SiteMetadata {
  name: string;
  license: string; // Could be any string
}
```

**After (Recommended):**
```typescript
import type { LicenseKey } from 'src/schemas/LicenseSchema';

interface SiteMetadata {
  name: string;
  license: LicenseKey; // Type-safe, only valid license keys
}
```

## Future Enhancements (Out of Scope)

- [ ] Image optimization/transformation on upload (WebP conversion, thumbnails)
- [ ] Progress indicators for large uploads
- [ ] Batch upload support
- [ ] Asset usage tracking (which pages reference which assets)
- [ ] Automatic orphaned asset cleanup job
- [ ] Asset CDN integration (see file-upload-analysis.md for Netlify CDN)
- [ ] Asset search and filtering in UI
- [ ] Drag-and-drop upload interface

## Related Documentation

- `docs/file-upload-analysis.md` - Comprehensive analysis of current upload patterns
- `.github/copilot-instructions.md` - Collection name constants pattern
- `src/schemas/AssetSchema.ts` - Current schema implementation
- `src/schemas/LicenseSchema.ts` - Shared license constants (new)
- `src/firebase/client/site/addAssetToSite.ts` - Current upload implementation
- `src/locales/fi/site.ts` - Finnish license translations
- `src/locales/en/site.ts` - English license translations

## Dependencies

- Firebase Storage SDK (already installed)
- Zod for schema validation (already installed)
- UUID library (already installed)
- i18n translations for `site:license.*` (already exist)
</text>

<old_text line=800>
- **Performance:** Image dimension extraction is async but non-blocking
- **Security:** File type validation prevents malicious uploads (frontend only - backend rules needed)
- **Thread Assets:** Thread uploads remain server-side due to transactional constraints (see file-upload-analysis.md)

## Notes

- **Backward Compatibility:** Optional fields during migration prevent breaking existing assets
- **Error Handling:** Storage deletion failures shouldn't break the app (log warnings only)
- **Performance:** Image dimension extraction is async but non-blocking
- **Security:** File type validation prevents malicious uploads (frontend only - backend rules needed)
- **Thread Assets:** Thread uploads remain server-side due to transactional constraints (see file-upload-analysis.md)

## API Changes

### Phase 4: Internal API Refactor (Non-Breaking from Data Perspective)

**Note:** This is NOT a conventional-commits "BREAKING CHANGE" because:
- ✅ **Data schema remains backwards-compatible** (all new fields are optional)
- ✅ **No external API changes** (internal helper function only)
- ✅ **Legacy data continues to work** with new code
- ✅ **New data works** with legacy code (extra fields ignored)
- ✅ **No database migration required** for system to function
- ⚠️ **Internal function signature changes** (3 call sites in our codebase)

**Changes:**
- `addAssetToSite()` signature adds required `uploadedBy: string` parameter
- Components calling `addAssetToSite()` must pass user ID from `$uid` store (3 call sites)
- New assets will include full metadata (`storagePath`, `mimetype`, `size`, `uploadedAt`, `uploadedBy`)
- Legacy assets continue to work (missing fields are optional in schema)

### Future (Phase 6, after migration period)
- `ASSET_LICENSES` and `ASSET_LICENSES_KEYS` will be removed from `AssetSchema`
- All imports must use `LICENSE_KEYS` and `LicenseSchema` from `LicenseSchema.ts`

**Impact:** 3 internal call sites need updating (TypeScript compiler will identify them). Can be completed in a single atomic commit.

## Benefits of Shared License Schema

1. **Single Source of Truth**: License definitions in one place
2. **Type Safety**: TypeScript `LicenseKey` type for compile-time validation
3. **i18n Integration**: Helper functions eliminate magic strings
4. **Reusability**: Can be used in any content type (sites, pages, threads, assets)
5. **Maintainability**: Changes to licenses happen in one file
6. **Validation**: `isValidLicense()` prevents invalid license values
7. **Documentation**: Clear JSDoc comments explain each license