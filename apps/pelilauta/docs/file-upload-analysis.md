# File Upload & Asset Management Analysis

**Document Version:** 1.0  
**Created:** 2025-10-23  
**Purpose:** Comprehensive analysis of current file upload patterns and recommendations for future development

---

## Executive Summary

Pelilauta-17 currently implements file uploads in **three distinct patterns** across the application:
1. **Client-side uploads** (Sites, Profiles) - Direct Firebase Storage uploads from browser
2. **Server-side uploads** (Threads, Replies) - Multipart form data handled by API routes
3. **Markdown imports** (Site pages) - Text file processing without storage upload

**Critical Finding:** These patterns **cannot be fully unified** due to architectural constraints. Thread and reply uploads must remain server-side because they are part of longer multi-document transactions that use waterfall API patterns and early-response patterns. Moving these to client-side would create race conditions and "ghost images" in Storage.

This document analyzes each pattern's strengths, weaknesses, and provides recommendations for:
- **Standardizing client-side uploads** for Sites and Profiles (independent operations)
- **Optimizing server-side uploads** for Threads and Replies (transactional operations)
- **Establishing a decision framework** for future upload features

---

## Current Implementation Overview

### 1. Storage Organization

Firebase Storage follows a hierarchical structure:

```
/Threads/{threadKey}/{uuid}-{filename}
/Sites/{siteKey}/{uuid}-{filename}
/profiles/{uid}/avatar.webp
```

**Key Principles:**
- Assets organized by owning entity (Thread, Site, Profile)
- UUID-prefixed filenames prevent collisions
- Assets deleted when parent entity is deleted (no orphans)
- Metadata stored in Firestore, not solely in Storage

### 2. Client-Side Upload Pattern

**Used by:**
- `src/firebase/client/site/addAssetToSite.ts` - Site asset uploads
- `src/firebase/client/profile/uploadAvatar.ts` - Profile avatar uploads
- `src/firebase/client/threads/addAssetToThread.ts` - Thread asset uploads (not currently used)
- `src/components/svelte/sites/assets/UploadAssetFab.svelte` - Site asset UI

**Flow:**
```typescript
// 1. User selects file in browser
// 2. Client resizes/processes image (if applicable)
await resizeImage(file); // Converts to WebP, max 1920px width

// 3. Direct upload to Firebase Storage (client SDK)
const { getStorage } = await import('firebase/storage');
await uploadBytes(storageRef, file);

// 4. Get download URL
const downloadURL = await getDownloadURL(storageRef);

// 5. Update Firestore with asset metadata
await updateDoc(docRef, { 
  assets: [...existingAssets, newAsset] 
});
```

**Characteristics:**
- ✅ **Pro:** Faster uploads (direct to Storage, no server middleman)
- ✅ **Pro:** Less server load and bandwidth costs
- ✅ **Pro:** Client-side image optimization (resizing, WebP conversion)
- ✅ **Pro:** Better progress tracking potential
- ❌ **Con:** Requires proper Storage security rules
- ❌ **Con:** Harder to validate file types/sizes server-side
- ❌ **Con:** Client can bypass restrictions if rules are misconfigured
- ❌ **Con:** No virus scanning or advanced processing

**Image Processing:**
```typescript
// src/utils/client/resizeImage.ts
export async function resizeImage(file: File, maxWidth = 1920): Promise<File> {
  // Uses Canvas API to resize and convert to WebP
  // Returns optimized File object
}
```

### 3. Server-Side Upload Pattern

**Used by:**
- `src/pages/api/threads/create.ts` - Thread creation with images
- `src/pages/api/threads/add-reply.ts` - Reply creation with images
- `src/firebase/client/threads/submitReply.ts` - Client-side submission helper

**Flow:**
```typescript
// 1. Client builds FormData with files
const formData = new FormData();
formData.append('markdownContent', content);
files.forEach((file, index) => {
  formData.append(`file_${index}`, file);
});

// 2. POST to API endpoint with Bearer token
await fetch('/api/threads/add-reply', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

// 3. Server parses multipart data
const formData = await request.formData();
const files: File[] = [];
for (const [key, value] of formData.entries()) {
  if (key.startsWith('file_') && value instanceof File) {
    files.push(value);
  }
}

// 4. Server uploads to Storage (Admin SDK)
const storage = getStorage(serverApp);
const buffer = Buffer.from(await file.arrayBuffer());
await bucket.file(storagePath).save(buffer);

// 5. Make file public and get URL
await cloudFile.makePublic();
const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
```

**Characteristics:**
- ✅ **Pro:** Server-side validation and security
- ✅ **Pro:** Can perform virus scanning, advanced processing
- ✅ **Pro:** Centralized error handling and logging
- ✅ **Pro:** Consistent URL generation (public URLs vs signed URLs)
- ❌ **Con:** Slower uploads (client → server → storage)
- ❌ **Con:** Higher server bandwidth and memory usage
- ❌ **Con:** Increased API response times
- ❌ **Con:** Size limits (FormData typically ~10MB in Astro/Node)

**Current Issues:**
1. **Inconsistent URL generation:**
   - `add-reply.ts`: Uses `makePublic()` and constructs public URL
   - `create.ts`: Uses signed URLs with far-future expiry (2491!)
   
2. **No image optimization:**
   - Server receives full-size images from client
   - No resizing or WebP conversion in server-side pattern

3. **Type validation differences:**
   - `add-reply.ts`: Only allows images (`file.type.startsWith('image/')`)
   - `create.ts`: No type validation in upload function

### 4. Markdown Import Pattern

**Used by:**
- `src/components/svelte/sites/import/UploadFilesForm.svelte` - Bulk page imports

**Flow:**
```typescript
// 1. User selects multiple .md files
<input type="file" accept=".md,.markdown" multiple />

// 2. Client reads files as text (FileReader)
const content = await readFileAsText(file);

// 3. Parse frontmatter and body
const { frontmatter, body } = parseMdFile(content);

// 4. Add to import queue (no upload yet)
importStore.addPages(processedFiles);

// 5. Later: Pages created via separate API calls
```

**Characteristics:**
- ✅ **Pro:** Batch processing of content
- ✅ **Pro:** Preview before commit
- ✅ **Pro:** No storage costs for text content
- ⚠️ **Neutral:** Files not uploaded to Storage (content stored in Firestore)
- ❌ **Con:** Embedded images in markdown need separate handling
- ❌ **Con:** No support for binary assets in import

---

## Asset Metadata Schema

```typescript
// src/schemas/AssetSchema.ts
export const AssetSchema = z.object({
  url: z.string(),                    // Download URL
  description: z.string().default(''),
  license: z.string().default('0'),   // See ASSET_LICENSES
  name: z.string().default(''),       // Display name
  mimetype: z.string().optional(),    // e.g., 'image/webp'
  storagePath: z.string().optional(), // Full path in Storage
});

// Stored in site.assets[], thread.images[]
```

**License Support:**
```typescript
export const ASSET_LICENSES = z.enum([
  '0',              // All rights reserved (default)
  'cc-by',          // Creative Commons Attribution
  'cc-by-sa',       // CC Attribution-ShareAlike
  'cc-by-nc',       // CC Attribution-NonCommercial
  'cc-by-nc-sa',    // CC Attribution-NonCommercial-ShareAlike
  'cc0',            // CC0 Public Domain
  'public-domain',  // Public Domain
  'OGL',            // Open Game License
]);
```

---

## UI Components Analysis

### File Input Components

#### 1. `AddFilesButton.svelte` - Generic File Picker
```svelte
<script lang="ts">
interface Props {
  accept?: string;        // MIME types, e.g., 'image/*'
  multiple?: boolean;     // Allow multiple files
  disabled?: boolean;
  addFiles: (files: File[]) => void;
}
</script>

<input type="file" style="display: none" bind:this={fileInputRef} />
<button onclick={handleButtonClick}>
  <cn-icon noun="assets"></cn-icon>
  <span>{t('actions:upload')}</span>
</button>
```
**Used by:** Thread editor, reply dialog

#### 2. `UploadAssetFab.svelte` - Site Asset Upload
```svelte
accept="image/*,video/*,audio/*,application/pdf,application/zip"

async function uploadFiles(files: FileList) {
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const resizedFile = await resizeImage(file);
      if (resizedFile.size > 10 * 1024 * 1024) throw new Error('Too big');
      await addAssetToSite(site, resizedFile);
    } else if (/* PDF, text, markdown */) {
      if (file.size > 10 * 1024 * 1024) throw new Error('Too big');
      await addAssetToSite(site, file);
    }
  }
}
```
**Features:**
- Multi-file type support
- Per-file-type size limits (10MB)
- Automatic image resizing
- Direct client-side upload

#### 3. `SiteThemeImageInput.svelte` - Theme Images
```svelte
interface Props {
  imageField: 'avatarURL' | 'posterURL' | 'backgroundURL';
}

async function fileChanged(e: Event) {
  const resized = await resizeImage(file);
  // Show preview
  preview = reader.result;
}

async function onsubmit() {
  const url = await addAssetToSite(site, file);
  update({ [imageField]: url });
}
```
**Features:**
- Preview before upload
- Reset/delete options
- Updates specific site theme field

---

## File Type Support Matrix

| File Type        | Client Upload | Server Upload | Size Limit | Processing     | Used By          |
|------------------|---------------|---------------|------------|----------------|------------------|
| Images (JPEG/PNG)| ✅ Yes        | ✅ Yes        | 10MB       | Resize, WebP   | Sites, Profiles, Threads |
| WebP             | ✅ Yes        | ✅ Yes        | 10MB       | Resize only    | Sites            |
| Video            | ✅ Yes*       | ❌ No         | 10MB       | None           | Sites only       |
| Audio            | ✅ Yes*       | ❌ No         | 10MB       | None           | Sites only       |
| PDF              | ✅ Yes*       | ❌ No         | 10MB       | None           | Sites only       |
| ZIP              | ✅ Yes*       | ❌ No         | 10MB       | None           | Sites only       |
| Markdown (.md)   | Import only   | ❌ No         | N/A        | Parse          | Site pages       |

*Only through `UploadAssetFab.svelte` for sites

---

## Security & Validation

### Current Validation

**Client-side (varies by component):**
```typescript
// Sites: Accept multiple types
accept="image/*,video/*,audio/*,application/pdf,application/zip"

// Threads/Replies: Only images
accept="image/*"

// Size check (inconsistent)
if (file.size > 10 * 1024 * 1024) throw new Error('Too big');
```

**Server-side:**
```typescript
// add-reply.ts: Type validation
if (!file.type.startsWith('image/')) {
  throw new Error('Invalid file type, only images allowed');
}

// create.ts: NO type validation!
// Anyone can upload any file type through thread creation
```

### Missing Security Measures

1. **Storage Security Rules managed externally** - Rules exist but not in this repository
2. **No server-side size validation** - Client can bypass limits
3. **No virus/malware scanning** - All uploads trusted
4. **No rate limiting** - Can spam uploads
5. **No content verification** - Files not validated beyond MIME type
6. **Inconsistent type checking** - Some endpoints unprotected

---

## Performance Analysis

### Upload Speed Comparison

**Client-side (direct to Storage):**
```
Browser → Firebase Storage → CDN
Typical: 2-5 seconds for 5MB image
```

**Server-side (via API):**
```
Browser → Netlify Edge → Server → Firebase Storage → CDN
Typical: 5-15 seconds for 5MB image
```

### Resource Usage

**Client uploads:**
- Server CPU: ✅ None
- Server memory: ✅ None
- Server bandwidth: ✅ None
- Client bandwidth: ⚠️ Full file size

**Server uploads:**
- Server CPU: ⚠️ Buffer conversion, file parsing
- Server memory: ⚠️ ~2x file size (buffer + form data)
- Server bandwidth: ❌ 2x file size (receive + send)
- Client bandwidth: ⚠️ Full file size

### Current Bottlenecks

1. **Thread creation/reply API slow** due to synchronous uploads
2. **No chunked uploads** - Large files timeout
3. **No upload progress feedback** for server uploads
4. **FormData size limits** restrict file sizes (~10MB)

---

## Decision Framework: Client-Side vs Server-Side Uploads

Use this framework to decide which upload pattern to use for new features:

### Choose **Client-Side Upload** when:

✅ Upload is independent (no transaction dependencies)  
✅ Single document update (e.g., profile avatar, site theme image)  
✅ User can retry on failure without side effects  
✅ No complex validation needed beyond type/size  
✅ Immediate feedback to user is important  
✅ Entity is owned by single user (easy authorization)

**Examples:** Profile avatars, site assets, standalone images

### Choose **Server-Side Upload** when:

⚠️ Part of multi-document transaction  
⚠️ Dependent on other operations (e.g., thread reply count update)  
⚠️ Complex validation or processing required  
⚠️ Need rollback capability if related operations fail  
⚠️ Waterfall API pattern (operation N depends on result of operation N-1)  
⚠️ Early response pattern (return before all background tasks complete)

**Examples:** Thread replies, thread creation, complex page updates

### Hybrid Approach (Advanced):

For some cases, you can use a hybrid approach:

```typescript
// 1. Client uploads image first
const imageUrl = await uploadAssetClientSide(file);

// 2. Client calls API with URL (not file)
const response = await fetch('/api/threads/add-reply', {
  method: 'POST',
  body: JSON.stringify({
    content: '...',
    imageUrl: imageUrl,  // Already uploaded
  }),
});

// 3. If API fails, client deletes uploaded image
if (!response.ok) {
  await deleteAssetClientSide(imageUrl);
}
```

**⚠️ Caution:** This adds complexity and still has race conditions (what if client crashes before cleanup?). Only use if performance gains significantly outweigh risks.

**Better alternative:** Optimize server-side pattern (streaming, parallel processing, early response).

---

## Consistency Issues

### 1. URL Generation Mismatch

**Problem:** Two different methods for public URLs

```typescript
// Method 1: add-reply.ts (correct)
await cloudFile.makePublic();
const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

// Method 2: create.ts (problematic)
const [url] = await fileRef.getSignedUrl({
  action: 'read',
  expires: '03-09-2491', // Year 2491! Will break in 466 years
});
```

**Impact:**
- Inconsistent URL formats in database
- Signed URLs have query parameters, complicate caching
- Year 2491 expiry is not infinite (better to use public URLs)

### 2. Metadata Storage Inconsistency

**Threads:**
```typescript
// Stored as images[] array
images: [
  { url: string, alt: string }  // Minimal metadata
]
```

**Sites:**
```typescript
// Stored as assets[] array with full Asset schema
assets: [
  {
    url: string,
    description: string,
    license: string,
    name: string,
    mimetype: string,
    storagePath: string,
  }
]
```

**Profiles:**
```typescript
// Just a URL field
avatarURL: string  // No metadata at all
```

### 3. Function Naming Inconsistency

```typescript
// Sites: "addAssetToSite" - Asset terminology
addAssetToSite(site: Site, file: File, metadata: Partial<Asset>)

// Threads: "addAssetToThread" - Asset terminology but different return
addAssetToThread(threadKey: string, file: File)
  // Returns: { downloadURL, storagePath }
  // Does NOT update Firestore (unlike addAssetToSite)

// Profiles: "uploadAvatar" - Upload terminology
uploadAvatar(file: File)
```

---

## Recommendations

### ⚠️ Critical Architectural Constraint: Thread Transactions

**IMPORTANT:** Thread updates and replies **cannot be migrated to client-side uploads** due to transactional requirements.

**The Problem:**

Thread operations involve complex multi-document transactions:
```typescript
// Simplified example of thread reply transaction
async function addReply(threadKey: string, reply: Reply, images: File[]) {
  // 1. Upload images to Storage
  const imageUrls = await uploadImages(images);
  
  // 2. Create reply document
  await db.collection('replies').add({ ...reply, images: imageUrls });
  
  // 3. Update thread document (increment reply count, update timestamps)
  await db.collection('threads').doc(threadKey).update({ 
    replyCount: increment(1),
    lastActivity: serverTimestamp() 
  });
  
  // 4. Update user statistics
  await db.collection('profiles').doc(uid).update({
    replyCount: increment(1)
  });
  
  // 5. Send notifications to subscribers
  await notifySubscribers(threadKey, reply);
  
  // 6. Return early (optimistic response)
  return { success: true, replyId: '...' };
  
  // 7. Background tasks continue (cache invalidation, search indexing, etc.)
}
```

**Why Client-Side Upload Fails:**

1. **Race Condition:** If client uploads images first, then calls API:
   ```
   Client: Upload image → Get URL → Call API → API starts transaction
   Problem: If API transaction fails, image is orphaned in Storage
   ```

2. **Ghost Images:** If transaction returns early and fails later:
   ```
   Server: Return success → Client shows image → Background task fails
   Problem: Image exists in Storage but not in Firestore
   ```

3. **Waterfall Dependencies:** Subsequent operations depend on previous results:
   ```
   Upload → Get URL → Create reply doc → Update thread → Update stats
   Problem: Cannot parallelize or split across client/server boundary
   ```

4. **Rollback Complexity:** Client-side uploads cannot be part of Firestore transactions:
   ```
   Firestore transactions can rollback database changes
   Storage uploads cannot be rolled back automatically
   Problem: Inconsistent state between Storage and Firestore
   ```

**The Solution:**

**Keep server-side uploads for threads** to maintain transactional integrity:
- Server handles entire operation atomically (or as close as possible)
- If any step fails, server can clean up uploaded images
- Client receives response only after critical operations complete
- Background tasks can continue after response without affecting consistency

**Pattern Separation:**

| Entity Type | Upload Pattern | Reason |
|-------------|----------------|--------|
| **Sites** | Client-side ✅ | Assets are independent, no complex transactions |
| **Profiles** | Client-side ✅ | Avatar is single field update, no dependencies |
| **Threads/Replies** | Server-side ⚠️ | Part of multi-step transactions, dependencies |
| **Pages** | Either ⚠️ | Simple updates can use client-side, complex edits need server-side |

**Revised Recommendation:**

Do NOT attempt to unify all uploads to client-side. Instead:
1. Use client-side for **independent, single-document operations** (Sites, Profiles)
2. Use server-side for **transactional, multi-document operations** (Threads, Replies)
3. Optimize server-side pattern (see "Server-Side Upload Optimizations" below)

---

### Server-Side Upload Optimizations

Since threads must use server-side uploads, optimize the pattern:

#### 1. Streaming Uploads (Reduce Memory Usage)

```typescript
// Instead of loading entire file into memory:
const buffer = Buffer.from(await file.arrayBuffer()); // ❌ 2x memory usage

// Stream directly to Storage:
const stream = Readable.from(file.stream()); // ✅ Minimal memory
await bucket.file(storagePath).save(stream);
```

#### 2. Parallel Processing (Reduce Latency)

```typescript
// Instead of sequential:
for (const file of files) {
  await uploadFile(file); // ❌ Slow
}

// Upload in parallel:
await Promise.all(
  files.map(file => uploadFile(file)) // ✅ Fast
);
```

#### 3. Early Response Pattern (Better UX)

```typescript
// Return to client ASAP, continue background processing:
async function addReply(data: ReplyData) {
  // 1. Critical operations (must complete)
  const images = await uploadImages(data.files);
  const replyId = await createReplyDoc({ ...data, images });
  await updateThreadDoc(data.threadKey);
  
  // 2. Return early
  const response = { success: true, replyId };
  
  // 3. Background operations (fire and forget)
  queueBackgroundTasks({
    updateUserStats: true,
    sendNotifications: true,
    invalidateCache: true,
    updateSearchIndex: true,
  });
  
  return response;
}
```

#### 4. Cleanup on Failure

```typescript
async function addReplyWithCleanup(data: ReplyData) {
  const uploadedFiles: string[] = [];
  
  try {
    // Upload images, track paths
    for (const file of data.files) {
      const path = await uploadFile(file);
      uploadedFiles.push(path);
    }
    
    // Create reply doc
    await createReplyDoc({ ...data, images: uploadedFiles });
    
    return { success: true };
    
  } catch (error) {
    // Cleanup uploaded files on failure
    await Promise.all(
      uploadedFiles.map(path => deleteFile(path))
    );
    
    throw error;
  }
}
```

#### 5. Image Optimization on Server

Since images must go through server, optimize there:

```typescript
import sharp from 'sharp'; // Add to dependencies

async function processImage(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  return await sharp(buffer)
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
```

---

### 1. Standardize on Client-Side Uploads (REVISED: Sites & Profiles Only) ⭐ PRIORITY

**Rationale:**
- Better performance (direct to Storage) for independent operations
- Lower server costs for non-transactional uploads
- Better user experience (faster uploads) where safe
- Scalability (offload from server) for simple operations

**Scope Limitation:**
- ✅ **Use client-side:** Sites, Profiles (independent, single-document updates)
- ❌ **Use server-side:** Threads, Replies (transactional, multi-document operations)
- ⚠️ **Evaluate case-by-case:** Pages, Characters, and other complex entities

**Implementation:**
```typescript
// NEW: src/firebase/client/uploads/standardUpload.ts

interface UploadConfig {
  allowedTypes: string[];      // ['image/*', 'video/*', 'application/pdf']
  maxSizeBytes: number;        // 10 * 1024 * 1024
  autoResize?: boolean;        // true for images
  maxWidth?: number;           // 1920 for images
  convertToWebP?: boolean;     // true for images
}

interface UploadResult {
  url: string;
  storagePath: string;
  metadata: {
    mimetype: string;
    size: number;
    name: string;
    processedAt: string;
  };
}

async function uploadAsset(
  file: File,
  storagePath: string,
  config: UploadConfig
): Promise<UploadResult> {
  // 1. Validate file type
  validateFileType(file, config.allowedTypes);
  
  // 2. Validate file size
  validateFileSize(file, config.maxSizeBytes);
  
  // 3. Process file if needed (resize, convert)
  const processedFile = await processFile(file, config);
  
  // 4. Upload to Storage (with dynamic import)
  const { getStorage, ref, uploadBytes, getDownloadURL } = 
    await import('firebase/storage');
  
  const storageRef = ref(getStorage(), storagePath);
  await uploadBytes(storageRef, processedFile);
  
  // 5. Get download URL
  const url = await getDownloadURL(storageRef);
  
  // 6. Return standardized result
  return {
    url,
    storagePath,
    metadata: {
      mimetype: processedFile.type,
      size: processedFile.size,
      name: processedFile.name,
      processedAt: new Date().toISOString(),
    },
  };
}
```

**Migration Path:**
1. Create new standardized upload utility for client-side uploads
2. Migrate Sites to use new utility (already client-side, just standardize)
3. Migrate Profiles to use new utility (already client-side, just standardize)
4. Optimize server-side pattern for Threads/Replies (see "Server-Side Upload Optimizations")
5. ~~Do NOT migrate Threads to client-side~~ - Keep server-side for transactional integrity
6. Evaluate other entities (Pages, Characters) on case-by-case basis

### 2. Review and Update Firebase Storage Security Rules ⭐ CRITICAL

**Note:** Storage security rules exist but are managed outside this repository. Review and update them as needed.

**Recommended rules structure:**

**Create/Update:** `storage.rules` (in Firebase Console or separate infrastructure repo)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Check file size (10MB max)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Helper: Check image types
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Helper: Check allowed asset types
    function isAllowedAssetType() {
      return request.resource.contentType.matches('image/.*')
          || request.resource.contentType.matches('video/.*')
          || request.resource.contentType.matches('audio/.*')
          || request.resource.contentType == 'application/pdf'
          || request.resource.contentType == 'application/zip';
    }
    
    // Threads: Only authenticated users, only images
    match /Threads/{threadKey}/{filename} {
      allow read: if true; // Public read (threads can be public)
      allow write: if isAuthenticated() 
                   && isImage() 
                   && isValidSize();
      allow delete: if isAuthenticated(); // TODO: Check thread ownership
    }
    
    // Sites: Only authenticated users, multiple types allowed
    match /Sites/{siteKey}/{filename} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() 
                   && isAllowedAssetType() 
                   && isValidSize();
      allow delete: if isAuthenticated(); // TODO: Check site ownership
    }
    
    // Profiles: User's own avatar only
    match /profiles/{userId}/{filename} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() 
                   && request.auth.uid == userId 
                   && isImage() 
                   && isValidSize();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

### 3. Unify Asset Metadata Schema

**Extend AssetSchema for all use cases:**

```typescript
// src/schemas/AssetSchema.ts (enhanced)

export const AssetMetadataSchema = z.object({
  url: z.string(),
  storagePath: z.string(),
  name: z.string(),
  mimetype: z.string(),
  size: z.number(),              // NEW: File size in bytes
  uploadedAt: z.string(),        // NEW: ISO timestamp
  uploadedBy: z.string(),        // NEW: User ID
  
  // Optional display metadata
  description: z.string().default(''),
  alt: z.string().default(''),   // NEW: For images in threads
  license: z.string().default('0'),
  
  // Optional processing metadata
  originalName: z.string().optional(),  // NEW: Before UUID prefix
  processed: z.boolean().default(false), // NEW: Was it resized/converted?
  originalSize: z.number().optional(),   // NEW: Before processing
});

export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;
```

**Update all entities to use consistent schema:**
```typescript
// Threads
interface Thread {
  images?: AssetMetadata[];  // Was: { url, alt }[]
}

// Sites
interface Site {
  assets?: AssetMetadata[];  // Already uses Asset, just extend
}

// Profiles
interface Profile {
  avatar?: AssetMetadata;    // Was: just avatarURL string
}
```

### 4. Implement Upload Progress Feedback

**For client-side uploads:**

```typescript
// src/firebase/client/uploads/uploadWithProgress.ts

interface ProgressCallback {
  (progress: number): void;  // 0-100
}

async function uploadWithProgress(
  file: File,
  storagePath: string,
  onProgress: ProgressCallback
): Promise<UploadResult> {
  const { getStorage, ref, uploadBytesResumable } = 
    await import('firebase/storage');
  
  const storageRef = ref(getStorage(), storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, storagePath, metadata: {...} });
      }
    );
  });
}
```

**UI Component:**

```svelte
<script lang="ts">
let uploadProgress = $state<number>(0);
let isUploading = $state(false);

async function handleUpload(file: File) {
  isUploading = true;
  
  await uploadWithProgress(
    file,
    storagePath,
    (progress) => uploadProgress = progress
  );
  
  isUploading = false;
}
</script>

{#if isUploading}
  <div class="progress-bar">
    <div style="width: {uploadProgress}%"></div>
    <span>{Math.round(uploadProgress)}%</span>
  </div>
{/if}
```

### 5. Add Server-Side Validation API

**Keep server-side for validation, but not upload:**

```typescript
// src/pages/api/validate-asset.ts

export async function POST({ request }: APIContext): Promise<Response> {
  const uid = await tokenToUid(request);
  if (!uid) return unauthorized();
  
  const { storagePath, metadata } = await request.json();
  
  // 1. Verify file exists in Storage
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  
  if (!exists) {
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'File not found' 
    }), { status: 404 });
  }
  
  // 2. Verify file metadata
  const [fileMetadata] = await file.getMetadata();
  
  // 3. Run validation checks
  // - Virus scan (if implemented)
  // - Size verification
  // - Type verification
  // - Content verification (image dimensions, etc.)
  
  // 4. Update Firestore with validated metadata
  // (Called by client after upload completes)
  
  return new Response(JSON.stringify({ 
    valid: true, 
    metadata: fileMetadata 
  }));
}
```

### 6. Implement Chunked/Resumable Uploads

**For large files (>10MB):**

```typescript
// Already supported by Firebase SDK!
import { uploadBytesResumable } from 'firebase/storage';

// Automatically handles:
// - Chunking
// - Resume after network interruption
// - Progress tracking
```

**Update size limits:**
```typescript
// Current: 10MB for all
// Recommended:
const SIZE_LIMITS = {
  'image/*': 10 * 1024 * 1024,      // 10MB
  'video/*': 100 * 1024 * 1024,     // 100MB (with chunking)
  'audio/*': 50 * 1024 * 1024,      // 50MB
  'application/pdf': 20 * 1024 * 1024, // 20MB
};
```

### 7. Standardize Function Naming

**Proposed naming convention:**

```typescript
// Upload functions (new files)
uploadAsset()           // Generic upload
uploadThreadImage()     // Thread-specific
uploadSiteAsset()       // Site-specific
uploadProfileAvatar()   // Profile-specific

// Update functions (existing files)
updateAssetMetadata()   // Update Firestore metadata
replaceAsset()          // Replace existing asset

// Delete functions
deleteAsset()           // Generic delete
deleteThreadImage()     // Thread-specific
deleteSiteAsset()       // Site-specific

// Query functions
getAssetMetadata()      // Fetch metadata
listAssets()            // List entity's assets
```

### 8. Add Comprehensive Error Handling

```typescript
// src/utils/uploads/UploadError.ts

export enum UploadErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

export class UploadError extends Error {
  constructor(
    public code: UploadErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

// Usage
throw new UploadError(
  UploadErrorCode.FILE_TOO_LARGE,
  'File exceeds 10MB limit',
  { size: file.size, limit: 10485760 }
);
```

**User-friendly error messages:**

```typescript
// src/locales/en/errors.json
{
  "upload": {
    "INVALID_FILE_TYPE": "This file type is not supported. Please upload {allowedTypes}.",
    "FILE_TOO_LARGE": "File is too large. Maximum size is {maxSize}.",
    "UPLOAD_FAILED": "Upload failed. Please check your connection and try again.",
    "PROCESSING_FAILED": "Failed to process file. Please try a different file.",
    "UNAUTHORIZED": "You must be signed in to upload files.",
    "QUOTA_EXCEEDED": "Storage quota exceeded. Please delete some files first."
  }
}
```

### 9. Add Upload Monitoring & Logging

```typescript
// src/utils/uploads/uploadLogger.ts

interface UploadLogEntry {
  uid: string;
  entityType: 'thread' | 'site' | 'profile';
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDuration: number;  // milliseconds
  success: boolean;
  error?: string;
  timestamp: string;
}

async function logUpload(entry: UploadLogEntry): Promise<void> {
  // Log to Firestore for analytics
  await serverDB.collection('upload_logs').add(entry);
  
  // Log to console for debugging
  logDebug('uploadLogger', entry);
}
```

### 10. Implement Asset Cleanup

```typescript
// src/utils/cleanup/orphanedAssets.ts

/**
 * Background job to find and delete orphaned assets
 * Run periodically (e.g., weekly) via Cloud Functions
 */
async function cleanupOrphanedAssets(): Promise<void> {
  // 1. List all files in Storage
  const [files] = await bucket.getFiles();
  
  // 2. For each file, check if parent entity exists
  for (const file of files) {
    const path = file.name;
    const [type, entityId] = parsePath(path);
    
    // Check Firestore for entity
    const exists = await entityExists(type, entityId);
    
    if (!exists) {
      // 3. Delete orphaned file
      await file.delete();
      logDebug('cleanupOrphanedAssets', `Deleted orphaned: ${path}`);
    }
  }
}
```

---

## Migration Checklist

### Phase 1: Security & Consistency (Weeks 1-2)
- [ ] Review and update `storage.rules` (managed externally)
- [ ] Fix thread creation URL generation (use public URLs)
- [ ] Add server-side type validation to `create.ts`
- [ ] Standardize error messages across all upload components
- [ ] Add upload size limits to all server endpoints

### Phase 2: Standardization (Weeks 3-4)
- [ ] Create `standardUpload.ts` utility
- [ ] Extend `AssetMetadataSchema` with new fields
- [ ] Update `addAssetToSite` to use standard utility
- [ ] Update `uploadAvatar` to use standard utility
- [ ] Update all UI components to use `AddFilesButton` or standardized versions

### Phase 3: Thread Migration - ⚠️ BLOCKED BY ARCHITECTURAL CONSTRAINTS
- [ ] ~~Create `uploadThreadImage` using client-side pattern~~ **NOT FEASIBLE**
- [ ] ~~Update `ReplyDialog` to use client-side upload~~ **NOT FEASIBLE**
- [ ] ~~Update `ThreadEditorForm` to use client-side upload~~ **NOT FEASIBLE**
- [ ] Keep server-side upload in `add-reply.ts` (required for transaction integrity)
- [ ] Keep server-side upload in `create.ts` (required for transaction integrity)

**Reason:** Thread updates and replies are part of longer Firestore transactions that can return early. Moving uploads to client-side would create race conditions where uploaded images become orphans if transactions fail, or "ghost images" appear in Storage if Firestore updates fail. The waterfall API pattern requires server-side uploads to maintain transactional consistency.

### Phase 4: Enhanced Features (Weeks 7-8)
- [ ] Implement `netlifyImage()` utility for image optimization
- [ ] Configure Astro image service for Netlify (optional)
- [ ] Update thread image display to use Netlify CDN
- [ ] Update site asset display to use Netlify CDN
- [ ] Implement progress tracking with `uploadBytesResumable`
- [ ] Add upload progress UI components
- [ ] Implement validation API endpoint
- [ ] Add comprehensive logging
- [ ] Create orphaned asset cleanup job

### Phase 5: Testing & Docs (Weeks 9-10)
- [ ] Write unit tests for upload utilities
- [ ] Write integration tests for each entity type
- [ ] Update API documentation
- [ ] Create user-facing help docs
- [ ] Performance testing and optimization

---

## Testing Strategy

### Unit Tests

```typescript
// test/util/standardUpload.test.ts

describe('standardUpload', () => {
  it('should validate file type', async () => {
    const file = new File(['content'], 'test.exe', { type: 'application/exe' });
    await expect(
      uploadAsset(file, 'path', { allowedTypes: ['image/*'] })
    ).rejects.toThrow(UploadError);
  });
  
  it('should validate file size', async () => {
    const largeFile = createMockFile(20 * 1024 * 1024); // 20MB
    await expect(
      uploadAsset(largeFile, 'path', { maxSizeBytes: 10 * 1024 * 1024 })
    ).rejects.toThrow(UploadError);
  });
  
  it('should resize images when configured', async () => {
    const image = createMockImage(3000, 2000);
    const result = await uploadAsset(image, 'path', { 
      autoResize: true, 
      maxWidth: 1920 
    });
    // Verify processed file dimensions
  });
});
```

### Integration Tests (E2E)

```typescript
// e2e/file-upload.spec.ts

test('should upload image to thread reply', async ({ page }) => {
  await page.goto('/threads/test-thread');
  await page.click('[data-testid="reply-button"]');
  
  // Upload file
  await page.setInputFiles('input[type="file"]', {
    name: 'test-image.jpg',
    mimeType: 'image/jpeg',
    buffer: await readFile('fixtures/test-image.jpg'),
  });
  
  // Submit
  await page.click('[data-testid="submit-reply"]');
  
  // Verify upload
  await expect(page.locator('.reply img')).toBeVisible();
});
```

---

## Cost Analysis

### Current Costs (Server-side uploads)

**Per 1000 thread creations with 1 image (5MB avg):**
- Server bandwidth in: 1000 × 5MB = 5GB
- Server bandwidth out: 1000 × 5MB = 5GB
- Firebase Storage write: 1000 operations
- Firebase Storage storage: 5GB
- Total bandwidth: 10GB

**Netlify Functions:**
- Execution time: ~5s per upload
- Total: 5000 seconds = 83 minutes
- Cost: $0.02/minute = $1.66

### Projected Costs (Client-side uploads)

**Per 1000 thread creations with 1 image (5MB avg):**
- Server bandwidth in: 0GB ✅
- Server bandwidth out: 0GB ✅
- Firebase Storage write: 1000 operations (same)
- Firebase Storage storage: 3GB (40% savings from WebP) ✅
- Total bandwidth: 0GB ✅

**Netlify Functions:**
- Execution time: 0 (no upload processing) ✅
- Cost: $0 ✅

**Savings per 1000 uploads: ~$1.66 + bandwidth costs**

---

## Netlify Image CDN Integration

**Context:** The application runs on Netlify and has `@netlify/images` package installed. Most upload issues are image-related, and we should leverage Netlify's built-in image optimization.

### Current State

**Status:** `@netlify/images@1.2.8` is installed but **not actively used** for serving images.

**Current image serving:**
- Images uploaded to Firebase Storage get direct URLs
- No automatic optimization, resizing, or format conversion at delivery time
- Manual WebP conversion happens only at upload time (client-side only)
- Every image size/format variation requires a new upload

### Netlify Image CDN Capabilities

Netlify provides automatic image optimization through URL parameters:

```html
<!-- Original Firebase Storage URL -->
<img src="https://storage.googleapis.com/bucket/Threads/abc/image.jpg" />

<!-- With Netlify Image CDN (if properly configured) -->
<img src="https://yoursite.netlify.app/.netlify/images?url=https://storage.googleapis.com/bucket/Threads/abc/image.jpg&w=800&fm=webp" />
```

**Features:**
- ✅ Automatic WebP/AVIF conversion based on browser support
- ✅ Dynamic resizing (`w=`, `h=`, `fit=`)
- ✅ Quality adjustment (`q=`)
- ✅ Format conversion (`fm=webp`, `fm=avif`)
- ✅ Automatic caching at CDN edge
- ✅ No build-time processing needed (on-demand)

**URL Parameters:**
```
?url=<image-url>     # Source image URL (must be from allowed domain)
&w=800               # Width in pixels
&h=600               # Height in pixels
&fit=cover           # Resize mode: cover, contain, fill, inside, outside
&position=center     # Crop position when using fit=cover
&fm=webp             # Format: auto, webp, avif, jpg, png
&q=80                # Quality: 1-100
```

### Recommended Architecture

**Option 1: Transparent Proxy Pattern** (Recommended for transactional uploads)

```typescript
// Server-side upload remains unchanged
// Add image transformation helper for display

// src/utils/images/netlifyImage.ts
export function netlifyImage(
  firebaseUrl: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'auto';
    quality?: number;
    fit?: 'cover' | 'contain';
  } = {}
): string {
  const params = new URLSearchParams();
  params.set('url', firebaseUrl);
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.format) params.set('fm', options.format);
  if (options.quality) params.set('q', options.quality.toString());
  if (options.fit) params.set('fit', options.fit);
  
  return `/.netlify/images?${params.toString()}`;
}
```

**Usage in components:**

```svelte
<script lang="ts">
import { netlifyImage } from '@utils/images/netlifyImage';

interface Props {
  imageUrl: string;
}
const { imageUrl }: Props = $props();

// Generate responsive srcset
const thumbnailUrl = netlifyImage(imageUrl, { width: 400, format: 'webp' });
const mediumUrl = netlifyImage(imageUrl, { width: 800, format: 'webp' });
const largeUrl = netlifyImage(imageUrl, { width: 1600, format: 'webp' });
</script>

<img
  src={mediumUrl}
  srcset="{thumbnailUrl} 400w, {mediumUrl} 800w, {largeUrl} 1600w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt="..."
  loading="lazy"
/>
```

**Option 2: Astro Image Integration** (For SSR pages)

```typescript
// astro.config.mjs
import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // ... existing config
  
  image: {
    service: {
      entrypoint: '@astrojs/netlify/image-service',
    },
    domains: ['storage.googleapis.com'],
  },
});
```

**Usage in Astro components:**

```astro
---
import { Image } from 'astro:assets';

const imageUrl = 'https://storage.googleapis.com/.../image.jpg';
---

<Image
  src={imageUrl}
  alt="..."
  width={800}
  height={600}
  format="webp"
  loading="lazy"
/>
```

### Benefits for Image-Heavy Operations

**1. Thread Images (Server-side uploads remain)**

```typescript
// Upload: Still server-side (for transaction integrity)
// BUT: Display uses Netlify CDN

// Before: Direct Firebase URL
<img src="https://storage.googleapis.com/.../thread-image.jpg" />

// After: Netlify-optimized
<img src="/.netlify/images?url=...&w=800&fm=webp&q=85" />
```

**Savings:**
- 60-80% file size reduction (AVIF/WebP vs JPEG)
- Responsive image delivery (right size for viewport)
- Browser-specific optimization (AVIF for Chrome, WebP fallback)
- CDN caching reduces Firebase bandwidth costs

**2. Site Assets (Client-side uploads)**

```typescript
// Option A: Skip client-side WebP conversion
// Let Netlify handle it at display time
// (Upload original JPEG/PNG, serve optimized)

// Option B: Still convert at upload for storage savings
// PLUS Netlify optimization for delivery
// (Best of both worlds: small storage + optimized delivery)
```

**3. Profile Avatars**

```typescript
// Multiple sizes without multiple uploads
const avatar = netlifyImage(user.avatarURL, { width: 48, format: 'webp' });  // Nav bar
const avatarLarge = netlifyImage(user.avatarURL, { width: 200, format: 'webp' });  // Profile page
```

### Implementation Roadmap

**Phase 1: Non-Breaking Addition (Week 1)**
1. Create `netlifyImage()` helper utility
2. Add Astro image service configuration (optional)
3. Document usage patterns for developers

**Phase 2: Gradual Rollout (Weeks 2-4)**
1. Update thread image display components to use `netlifyImage()`
2. Update site asset display to use `netlifyImage()`
3. Update profile avatar display to use `netlifyImage()`
4. A/B test performance improvements

**Phase 3: Optimization (Weeks 5-6)**
1. Remove client-side WebP conversion (optional - Netlify handles it)
2. Implement responsive image srcsets
3. Add lazy loading and modern loading strategies
4. Configure Netlify CDN cache headers

**Phase 4: Monitoring (Ongoing)**
1. Track Firebase Storage bandwidth reduction
2. Monitor Netlify image transformation usage
3. Analyze page load performance improvements
4. Adjust quality/size parameters based on metrics

### Configuration Requirements

**1. Netlify Configuration**

Update `netlify.toml`:
```toml
# Enable image CDN for Firebase Storage
[[redirects]]
  from = "/.netlify/images"
  to = "/.netlify/images"
  status = 200
  force = true
  
  # Allow Firebase Storage as image source
  [redirects.headers]
    X-Robots-Tag = "noindex"

# Optional: Add cache headers for transformed images
[[headers]]
  for = "/.netlify/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**2. Firebase Storage CORS**

Ensure Firebase Storage allows Netlify Image CDN requests:
```json
[
  {
    "origin": ["https://*.netlify.app", "https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

**3. Content Security Policy**

Update CSP to allow Netlify images (already configured in `netlify.toml`):
```
img-src 'self' data: https: blob:;
```

### Cost Analysis

**Current costs (per 1000 thread images viewed):**
- Firebase Storage bandwidth: 1000 × 5MB = 5GB
- Cost: ~$0.10/GB = $0.50

**With Netlify Image CDN:**
- Firebase Storage bandwidth (first request): 1000 × 5MB = 5GB
- Netlify image transformations: 1000 operations
- Netlify CDN cache hits (subsequent): 0GB from Firebase
- Average response size (AVIF): 1000 × 1.5MB = 1.5GB

**Projected savings:**
- 70% reduction in delivered bandwidth (5GB → 1.5GB)
- 90%+ cache hit rate on popular images
- Faster page loads (smaller files + CDN edge delivery)
- Reduced Firebase costs over time

### Caveats and Considerations

**1. External Domain Limitation**

Netlify Image CDN works best with:
- ✅ Images hosted on Netlify itself
- ✅ External URLs from allowed domains (Firebase Storage)
- ❌ May have rate limits or restrictions per plan

**2. Build Time vs Request Time**

- **Astro `<Image>`**: Processes at build time (SSG) or request time (SSR)
- **`/.netlify/images` endpoint**: Always at request time (on-demand)
- **Recommendation**: Use `/.netlify/images` for user-uploaded content

**3. Original File Size Still Matters**

Netlify can't work miracles:
- Still optimize at upload (resize to 1920px max)
- Still convert to WebP/AVIF if possible
- Netlify adds responsive delivery on top

**4. Firebase Storage Still Needed**

This is **not a replacement** for Firebase Storage:
- Firebase Storage: Source of truth, permanent storage
- Netlify Image CDN: Delivery optimization layer

### Testing Strategy

**1. Unit Tests**

```typescript
// test/utils/netlifyImage.test.ts
import { netlifyImage } from '@utils/images/netlifyImage';

describe('netlifyImage', () => {
  it('should generate valid Netlify image URL', () => {
    const url = netlifyImage('https://storage.googleapis.com/.../image.jpg', {
      width: 800,
      format: 'webp',
    });
    
    expect(url).toContain('/.netlify/images');
    expect(url).toContain('w=800');
    expect(url).toContain('fm=webp');
  });
});
```

**2. Performance Tests**

```typescript
// e2e/image-performance.spec.ts
test('should load optimized images faster', async ({ page }) => {
  await page.goto('/threads/test-thread');
  
  // Check that images use Netlify CDN
  const img = page.locator('article img').first();
  const src = await img.getAttribute('src');
  expect(src).toContain('/.netlify/images');
  
  // Check file size is reasonable
  const response = await page.request.get(src);
  expect(response.headers()['content-type']).toContain('webp');
});
```

### Alternative: Cloudflare Images

If Netlify Image CDN limitations are a concern, consider:

**Cloudflare Images:**
- More generous limits
- Better control over transformations
- Additional cost ($5/month + $1 per 100k images)
- Requires separate service integration

**Trade-offs:**
- ✅ Better: More features, higher limits, dedicated service
- ❌ Worse: Additional cost, more complex setup, another dependency

---

## Future Enhancements

### 1. ~~Image CDN Integration~~ ✅ See "Netlify Image CDN Integration" Section
- ~~CloudFlare Images or imgix for automatic optimization~~
- ~~Dynamic resizing based on viewport~~
- ~~WebP/AVIF serving based on browser support~~

**Status:** Covered in dedicated section above. Use Netlify Image CDN as first choice.

### 2. Virus Scanning
- Integrate ClamAV or cloud service
- Scan before making files public
- Quarantine suspicious files

### 3. Asset Thumbnails
- Generate thumbnails on upload
- Store multiple sizes for responsive images
- Use Cloud Functions for processing

### 4. Asset Search & Discovery
- Full-text search on asset metadata
- Tag-based filtering
- Usage analytics (which assets are viewed most)

### 5. Asset Sharing & Embedding
- Public asset gallery per site
- Embed codes for external use
- Usage tracking and attribution

### 6. Advanced Processing
- Video transcoding (WebM, MP4)
- Audio format conversion
- PDF thumbnail generation
- Document text extraction

### 7. Collaborative Asset Management
- Asset versioning
- Comment threads on assets
- Collection/album organization
- Batch operations (delete, move, tag)

---

## Appendices

### A. Related Files

**Client-side Upload:**
- `src/firebase/client/site/addAssetToSite.ts`
- `src/firebase/client/threads/addAssetToThread.ts`
- `src/firebase/client/profile/uploadAvatar.ts`
- `src/utils/client/resizeImage.ts`

**Server-side Upload:**
- `src/pages/api/threads/create.ts`
- `src/pages/api/threads/add-reply.ts`
- `src/firebase/client/threads/submitReply.ts`

**UI Components:**
- `src/components/svelte/app/AddFilesButton.svelte`
- `src/components/svelte/sites/assets/UploadAssetFab.svelte`
- `src/components/svelte/sites/settings/SiteThemeImageInput.svelte`
- `src/components/svelte/discussion/ReplyDialog.svelte`
- `src/components/svelte/thread-editor/ThreadEditorForm.svelte`

**Schemas:**
- `src/schemas/AssetSchema.ts`
- `src/schemas/SiteSchema.ts` (assets field)
- `src/schemas/ThreadSchema.ts` (images field)
- `src/schemas/ProfileSchema.ts` (avatarURL field)

**Documentation:**
- `src/docs/73-asset-management.md`

### B. Firebase SDK Reference

**Client-side:**
```typescript
import { getStorage, ref, uploadBytes, uploadBytesResumable, 
         getDownloadURL, deleteObject } from 'firebase/storage';
```

**Server-side (Admin SDK):**
```typescript
import { getStorage } from 'firebase-admin/storage';
const bucket = getStorage().bucket();
```

### C. Glossary

- **Asset**: Any file uploaded and managed by the system (images, videos, documents)
- **Client-side upload**: Browser directly uploads to Firebase Storage
- **Server-side upload**: Browser sends to API endpoint, server uploads to Storage
- **Multipart form data**: HTTP format for sending files with other data
- **Storage path**: Full path to file in Firebase Storage (e.g., `/Sites/abc/file.jpg`)
- **Download URL**: Public URL to access file (may be signed or public)
- **WebP**: Modern image format with better compression than JPEG/PNG
- **UUID**: Universally Unique Identifier, used to prevent filename collisions

---

## Conclusion

The current file upload implementation is **functional but inconsistent**, with three different patterns serving different use cases. The primary recommendation is to **standardize on client-side uploads** for performance and cost reasons, while maintaining server-side validation through dedicated API endpoints.

**Key priorities:**
1. ⭐ **Security first:** Implement Storage security rules immediately
2. ⭐ **Fix inconsistencies:** Standardize URL generation and metadata schemas
3. ⭐ **Performance:** Migrate to client-side uploads for all entity types
4. **User experience:** Add progress tracking and better error messages
5. **Maintainability:** Create reusable upload utilities and comprehensive tests

This migration can be done incrementally over 10 weeks with minimal disruption to existing functionality.
