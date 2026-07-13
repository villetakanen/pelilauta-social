import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Firebase modules before importing assetUploadHelpers
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('src/firebase/client', () => ({
  app: {},
}));

import {
  ASSET_MAX_SIZE_BYTES,
  generateStoragePath,
  getImageDimensions,
  type StorageUploadResult,
  uploadToStorage,
  validateFileSize,
  validateFileType,
} from './assetUploadHelpers';

describe('ASSET_MAX_SIZE_BYTES', () => {
  it('should be set to 10MB', () => {
    expect(ASSET_MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe('validateFileSize', () => {
  it('should pass for files under the default limit', () => {
    const file = new File(['a'.repeat(1000)], 'small.txt', {
      type: 'text/plain',
    });
    Object.defineProperty(file, 'size', { value: 1000 });

    expect(() => validateFileSize(file)).not.toThrow();
  });

  it('should pass for files exactly at the limit', () => {
    const file = new File(['content'], 'exact.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: ASSET_MAX_SIZE_BYTES });

    expect(() => validateFileSize(file)).not.toThrow();
  });

  it('should throw for files over the default limit', () => {
    const file = new File(['content'], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: ASSET_MAX_SIZE_BYTES + 1 });

    expect(() => validateFileSize(file)).toThrow(/exceeds maximum/);
  });

  it('should include file size and limit in error message', () => {
    const file = new File(['content'], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB

    expect(() => validateFileSize(file)).toThrow('15.00MB');
    expect(() => validateFileSize(file)).toThrow('10.00MB');
  });

  it('should accept custom size limits', () => {
    const file = new File(['content'], 'medium.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 2000 });

    expect(() => validateFileSize(file, 1000)).toThrow();
    expect(() => validateFileSize(file, 3000)).not.toThrow();
  });

  it('should handle zero-byte files', () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 0 });

    expect(() => validateFileSize(file)).not.toThrow();
  });
});

describe('validateFileType', () => {
  it('should accept exact mimetype matches', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });

    expect(() => validateFileType(file, ['image/png'])).not.toThrow();
  });

  it('should accept wildcard patterns', () => {
    const pngFile = new File(['content'], 'test.png', { type: 'image/png' });
    const jpegFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const webpFile = new File(['content'], 'test.webp', { type: 'image/webp' });

    expect(() => validateFileType(pngFile, ['image/*'])).not.toThrow();
    expect(() => validateFileType(jpegFile, ['image/*'])).not.toThrow();
    expect(() => validateFileType(webpFile, ['image/*'])).not.toThrow();
  });

  it('should accept multiple allowed types', () => {
    const pdfFile = new File(['content'], 'doc.pdf', {
      type: 'application/pdf',
    });
    const textFile = new File(['content'], 'note.txt', { type: 'text/plain' });

    const allowedTypes = ['application/pdf', 'text/plain'];

    expect(() => validateFileType(pdfFile, allowedTypes)).not.toThrow();
    expect(() => validateFileType(textFile, allowedTypes)).not.toThrow();
  });

  it('should accept mixed exact and wildcard patterns', () => {
    const imageFile = new File(['content'], 'image.png', {
      type: 'image/png',
    });
    const pdfFile = new File(['content'], 'doc.pdf', {
      type: 'application/pdf',
    });

    const allowedTypes = ['image/*', 'application/pdf'];

    expect(() => validateFileType(imageFile, allowedTypes)).not.toThrow();
    expect(() => validateFileType(pdfFile, allowedTypes)).not.toThrow();
  });

  it('should throw for non-matching types', () => {
    const exeFile = new File(['content'], 'app.exe', {
      type: 'application/x-msdownload',
    });

    expect(() => validateFileType(exeFile, ['image/*'])).toThrow(/not allowed/);
  });

  it('should include file type and allowed types in error message', () => {
    const zipFile = new File(['content'], 'archive.zip', {
      type: 'application/zip',
    });
    const allowedTypes = ['image/*', 'application/pdf'];

    expect(() => validateFileType(zipFile, allowedTypes)).toThrow(
      'application/zip',
    );
    expect(() => validateFileType(zipFile, allowedTypes)).toThrow('image/*');
    expect(() => validateFileType(zipFile, allowedTypes)).toThrow(
      'application/pdf',
    );
  });

  it('should handle empty type', () => {
    const file = new File(['content'], 'unknown', { type: '' });

    expect(() => validateFileType(file, ['image/*'])).toThrow();
  });

  it('should be case-sensitive in pattern matching', () => {
    // Note: Browsers always normalize File.type to lowercase
    const file = new File(['content'], 'test.png', { type: 'image/png' });

    // Our validation is case-sensitive, so uppercase pattern won't match
    expect(() => validateFileType(file, ['image/PNG'])).toThrow();
    expect(() => validateFileType(file, ['image/png'])).not.toThrow();
  });
});

describe('generateStoragePath', () => {
  it('should generate valid storage paths for Sites', () => {
    const path = generateStoragePath('Sites', 'site123', 'image.png');

    expect(path).toMatch(/^Sites\/site123\/[a-f0-9-]+-image\.png$/);
  });

  it('should generate valid storage paths for Threads', () => {
    const path = generateStoragePath('Threads', 'thread456', 'photo.jpg');

    expect(path).toMatch(/^Threads\/thread456\/[a-f0-9-]+-photo\.jpg$/);
  });

  it('should generate valid storage paths for Profiles', () => {
    const path = generateStoragePath('Profiles', 'user789', 'avatar.webp');

    expect(path).toMatch(/^Profiles\/user789\/[a-f0-9-]+-avatar\.webp$/);
  });

  it('should include UUID in filename', () => {
    const path = generateStoragePath('Sites', 'site123', 'test.png');

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(path).toMatch(
      /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/,
    );
  });

  it('should generate unique paths for same filename', () => {
    const path1 = generateStoragePath('Sites', 'site123', 'test.png');
    const path2 = generateStoragePath('Sites', 'site123', 'test.png');

    expect(path1).not.toBe(path2);
  });

  it('should handle filenames with special characters', () => {
    const path = generateStoragePath('Sites', 'site123', 'my image (1).png');

    expect(path).toContain('my image (1).png');
    expect(path).toMatch(/^Sites\/site123\/[a-f0-9-]+-my image \(1\)\.png$/);
  });

  it('should handle filenames with multiple extensions', () => {
    const path = generateStoragePath('Sites', 'site123', 'archive.tar.gz');

    expect(path).toContain('archive.tar.gz');
    expect(path).toMatch(/^Sites\/site123\/[a-f0-9-]+-archive\.tar\.gz$/);
  });

  it('should handle very long filenames', () => {
    const longFilename = `${'a'.repeat(200)}.txt`;
    const path = generateStoragePath('Sites', 'site123', longFilename);

    expect(path).toContain(longFilename);
  });
});

describe('getImageDimensions', () => {
  beforeEach(() => {
    // Mock Image constructor for testing
    global.Image = class MockImage {
      private _onload: (() => void) | null = null;
      private _onerror: (() => void) | null = null;
      width = 0;
      height = 0;

      set onload(handler: (() => void) | null) {
        this._onload = handler;
      }

      get onload() {
        return this._onload;
      }

      set onerror(handler: (() => void) | null) {
        this._onerror = handler;
      }

      get onerror() {
        return this._onerror;
      }

      set src(_value: string) {
        // Simulate successful image load
        setTimeout(() => {
          this.width = 1920;
          this.height = 1080;
          if (this._onload) {
            this._onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return undefined for non-image files', async () => {
    const pdfFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });

    const dimensions = await getImageDimensions(pdfFile);

    expect(dimensions).toBeUndefined();
  });

  it('should return dimensions for image files', async () => {
    const imageFile = new File(['content'], 'image.png', {
      type: 'image/png',
    });

    const dimensions = await getImageDimensions(imageFile);

    expect(dimensions).toBeDefined();
    expect(dimensions?.width).toBe(1920);
    expect(dimensions?.height).toBe(1080);
  });

  it('should work with different image types', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const webpFile = new File(['content'], 'image.webp', {
      type: 'image/webp',
    });

    const jpegDims = await getImageDimensions(jpegFile);
    const webpDims = await getImageDimensions(webpFile);

    expect(jpegDims).toBeDefined();
    expect(webpDims).toBeDefined();
  });

  it('should create and revoke object URL', async () => {
    const imageFile = new File(['content'], 'image.png', {
      type: 'image/png',
    });

    await getImageDimensions(imageFile);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(imageFile);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should handle image load errors gracefully', async () => {
    // Override Image mock to simulate error
    global.Image = class MockImageError {
      private _onerror: (() => void) | null = null;

      set onerror(handler: (() => void) | null) {
        this._onerror = handler;
      }

      get onerror() {
        return this._onerror;
      }

      set onload(_handler: (() => void) | null) {
        // Ignored
      }

      set src(_value: string) {
        setTimeout(() => {
          if (this._onerror) {
            this._onerror();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    const imageFile = new File(['content'], 'corrupt.png', {
      type: 'image/png',
    });

    const dimensions = await getImageDimensions(imageFile);

    expect(dimensions).toBeUndefined();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe('uploadToStorage', () => {
  it('should have type signature that returns StorageUploadResult', () => {
    // Type test - this will fail to compile if types don't match
    const _typeTest: (
      file: File,
      path: string,
    ) => Promise<StorageUploadResult> = uploadToStorage;

    expect(_typeTest).toBe(uploadToStorage);
  });

  // Note: Full integration tests for uploadToStorage would require
  // mocking Firebase Storage, which is complex. These tests verify
  // the interface and type contracts. Actual upload testing should
  // be done in E2E tests or with Firebase emulator.
});

describe('Integration scenarios', () => {
  it('should validate file before generating path', () => {
    const largeFile = new File(['content'], 'huge.png', {
      type: 'image/png',
    });
    Object.defineProperty(largeFile, 'size', {
      value: ASSET_MAX_SIZE_BYTES + 1,
    });

    expect(() => validateFileSize(largeFile)).toThrow();

    // If validation passed (which it shouldn't), we'd generate path:
    // const path = generateStoragePath('Sites', 'site123', largeFile.name);
  });

  it('should validate type before generating path', () => {
    const exeFile = new File(['content'], 'malware.exe', {
      type: 'application/x-msdownload',
    });

    expect(() => validateFileType(exeFile, ['image/*'])).toThrow();
  });

  it('should handle typical site asset upload flow', () => {
    const imageFile = new File(['content'], 'banner.png', {
      type: 'image/png',
    });
    Object.defineProperty(imageFile, 'size', { value: 500000 }); // 500KB

    // Validation
    expect(() => validateFileSize(imageFile)).not.toThrow();
    expect(() =>
      validateFileType(imageFile, ['image/*', 'application/pdf']),
    ).not.toThrow();

    // Path generation
    const path = generateStoragePath('Sites', 'my-site', imageFile.name);
    expect(path).toMatch(/^Sites\/my-site\/[a-f0-9-]+-banner\.png$/);
  });

  it('should handle typical thread image upload flow', () => {
    const photoFile = new File(['content'], 'screenshot.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(photoFile, 'size', { value: 2000000 }); // 2MB

    // Validation
    expect(() => validateFileSize(photoFile)).not.toThrow();
    expect(() => validateFileType(photoFile, ['image/*'])).not.toThrow();

    // Path generation
    const path = generateStoragePath('Threads', 'thread-123', photoFile.name);
    expect(path).toMatch(/^Threads\/thread-123\/[a-f0-9-]+-screenshot\.jpg$/);
  });

  it('should reject invalid uploads at validation stage', () => {
    const tooBigPdf = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(tooBigPdf, 'size', { value: 20 * 1024 * 1024 }); // 20MB

    expect(() => validateFileSize(tooBigPdf)).toThrow(/exceeds maximum/);
    expect(() => validateFileType(tooBigPdf, ['image/*'])).toThrow(
      /not allowed/,
    );
  });
});
