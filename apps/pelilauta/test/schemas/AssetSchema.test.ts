import { describe, expect, it } from 'vitest';
import {
  type Asset,
  createAssetMetadata,
  parseAsset,
} from '../../src/schemas/AssetSchema';

describe('AssetSchema', () => {
  describe('backward compatibility', () => {
    it('should parse legacy assets with minimal fields', () => {
      const legacyAsset = {
        url: 'https://example.com/image.png',
        name: 'image.png',
        description: '',
        license: '0',
      };

      const result = parseAsset(legacyAsset);

      expect(result.url).toBe(legacyAsset.url);
      expect(result.name).toBe(legacyAsset.name);
      expect(result.description).toBe('');
      expect(result.license).toBe('0');
    });

    it('should apply defaults for missing optional fields', () => {
      const minimalAsset = {
        url: 'https://example.com/file.pdf',
      };

      const result = parseAsset(minimalAsset);

      expect(result.url).toBe(minimalAsset.url);
      expect(result.name).toBe('');
      expect(result.description).toBe('');
      expect(result.license).toBe('0');
      expect(result.mimetype).toBeUndefined();
      expect(result.storagePath).toBeUndefined();
      expect(result.size).toBeUndefined();
      expect(result.uploadedAt).toBeUndefined();
      expect(result.uploadedBy).toBeUndefined();
    });

    it('should parse assets with storagePath and mimetype', () => {
      const assetWithStorage = {
        url: 'https://example.com/image.png',
        name: 'image.png',
        description: 'A test image',
        license: 'cc-by',
        mimetype: 'image/png',
        storagePath: 'Sites/site123/uuid-image.png',
      };

      const result = parseAsset(assetWithStorage);

      expect(result.mimetype).toBe('image/png');
      expect(result.storagePath).toBe('Sites/site123/uuid-image.png');
    });
  });

  describe('new metadata fields (Phase 2)', () => {
    it('should parse assets with tracking metadata', () => {
      const fullAsset = {
        url: 'https://example.com/image.png',
        storagePath: 'Sites/site123/uuid-image.png',
        name: 'image.png',
        description: 'A test image',
        license: 'cc-by',
        mimetype: 'image/png',
        size: 1024000,
        uploadedAt: '2024-01-15T10:30:00.000Z',
        uploadedBy: 'user123',
      };

      const result = parseAsset(fullAsset);

      expect(result.size).toBe(1024000);
      expect(result.uploadedAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result.uploadedBy).toBe('user123');
    });

    it('should parse assets with image dimensions', () => {
      const imageAsset = {
        url: 'https://example.com/image.png',
        name: 'image.png',
        mimetype: 'image/png',
        size: 1024000,
        uploadedAt: '2024-01-15T10:30:00.000Z',
        uploadedBy: 'user123',
        width: 1920,
        height: 1080,
      };

      const result = parseAsset(imageAsset);

      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should allow image dimensions to be undefined', () => {
      const pdfAsset = {
        url: 'https://example.com/document.pdf',
        name: 'document.pdf',
        mimetype: 'application/pdf',
        size: 500000,
        uploadedAt: '2024-01-15T10:30:00.000Z',
        uploadedBy: 'user123',
      };

      const result = parseAsset(pdfAsset);

      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should throw error if url is missing', () => {
      const invalidAsset = {
        name: 'image.png',
        description: 'A test image',
      };

      expect(() => parseAsset(invalidAsset)).toThrow();
    });

    it('should throw error if url is not a string', () => {
      const invalidAsset = {
        url: 123,
        name: 'image.png',
      };

      expect(() => parseAsset(invalidAsset)).toThrow();
    });

    it('should reject invalid size (not a number)', () => {
      const invalidAsset = {
        url: 'https://example.com/image.png',
        size: '1024',
      };

      expect(() => parseAsset(invalidAsset)).toThrow();
    });

    it('should reject invalid dimensions (not numbers)', () => {
      const invalidAsset = {
        url: 'https://example.com/image.png',
        width: '1920',
        height: '1080',
      };

      expect(() => parseAsset(invalidAsset)).toThrow();
    });
  });
});

describe('createAssetMetadata', () => {
  const mockFile = new File(['content'], 'test-image.png', {
    type: 'image/png',
  });
  Object.defineProperty(mockFile, 'size', { value: 1024000 });

  it('should create complete asset metadata from file', () => {
    const url = 'https://example.com/test-image.png';
    const storagePath = 'Sites/site123/uuid-test-image.png';
    const uploadedBy = 'user123';

    const result = createAssetMetadata(url, storagePath, mockFile, uploadedBy);

    expect(result.url).toBe(url);
    expect(result.storagePath).toBe(storagePath);
    expect(result.name).toBe('test-image.png');
    expect(result.mimetype).toBe('image/png');
    expect(result.size).toBe(1024000);
    expect(result.uploadedBy).toBe(uploadedBy);
    expect(result.uploadedAt).toBeDefined();
    expect(result.description).toBe('');
    expect(result.license).toBe('0');
  });

  it('should use provided additional metadata', () => {
    const url = 'https://example.com/test-image.png';
    const storagePath = 'Sites/site123/uuid-test-image.png';
    const uploadedBy = 'user123';
    const additionalData = {
      name: 'Custom Name',
      description: 'A custom description',
      license: 'cc-by',
    };

    const result = createAssetMetadata(
      url,
      storagePath,
      mockFile,
      uploadedBy,
      additionalData,
    );

    expect(result.name).toBe('Custom Name');
    expect(result.description).toBe('A custom description');
    expect(result.license).toBe('cc-by');
  });

  it('should include image dimensions if provided', () => {
    const url = 'https://example.com/test-image.png';
    const storagePath = 'Sites/site123/uuid-test-image.png';
    const uploadedBy = 'user123';
    const additionalData = {
      width: 1920,
      height: 1080,
    };

    const result = createAssetMetadata(
      url,
      storagePath,
      mockFile,
      uploadedBy,
      additionalData,
    );

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('should generate ISO timestamp for uploadedAt', () => {
    const url = 'https://example.com/test-image.png';
    const storagePath = 'Sites/site123/uuid-test-image.png';
    const uploadedBy = 'user123';

    const beforeTime = new Date();
    const result = createAssetMetadata(url, storagePath, mockFile, uploadedBy);
    const afterTime = new Date();

    expect(result.uploadedAt).toBeDefined();

    if (result.uploadedAt) {
      expect(result.uploadedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Convert ISO string back to Date for comparison
      const uploadedDate = new Date(result.uploadedAt);
      expect(uploadedDate.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(uploadedDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    }
  });

  it('should use file name when no custom name provided', () => {
    const url = 'https://example.com/my-document.pdf';
    const storagePath = 'Sites/site123/uuid-my-document.pdf';
    const uploadedBy = 'user123';
    const pdfFile = new File(['content'], 'my-document.pdf', {
      type: 'application/pdf',
    });

    const result = createAssetMetadata(url, storagePath, pdfFile, uploadedBy);

    expect(result.name).toBe('my-document.pdf');
  });

  it('should handle files without dimensions (non-images)', () => {
    const url = 'https://example.com/document.pdf';
    const storagePath = 'Sites/site123/uuid-document.pdf';
    const uploadedBy = 'user123';
    const pdfFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });

    const result = createAssetMetadata(url, storagePath, pdfFile, uploadedBy);

    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.mimetype).toBe('application/pdf');
  });
});

describe('Asset type', () => {
  it('should allow accessing all asset properties', () => {
    const asset: Asset = {
      url: 'https://example.com/image.png',
      storagePath: 'Sites/site123/uuid-image.png',
      name: 'image.png',
      description: 'A test image',
      license: 'cc-by',
      mimetype: 'image/png',
      size: 1024000,
      uploadedAt: '2024-01-15T10:30:00.000Z',
      uploadedBy: 'user123',
      width: 1920,
      height: 1080,
    };

    // Type assertions to verify all properties are accessible
    expect(asset.url).toBeDefined();
    expect(asset.storagePath).toBeDefined();
    expect(asset.name).toBeDefined();
    expect(asset.description).toBeDefined();
    expect(asset.license).toBeDefined();
    expect(asset.mimetype).toBeDefined();
    expect(asset.size).toBeDefined();
    expect(asset.uploadedAt).toBeDefined();
    expect(asset.uploadedBy).toBeDefined();
    expect(asset.width).toBeDefined();
    expect(asset.height).toBeDefined();
  });

  it('should allow partial Asset with only required fields', () => {
    const minimalAsset: Asset = {
      url: 'https://example.com/image.png',
      name: '',
      description: '',
      license: '0',
    };

    expect(minimalAsset.url).toBe('https://example.com/image.png');
  });
});
