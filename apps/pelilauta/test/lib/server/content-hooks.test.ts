/**
 * Unit tests for content update hooks
 *
 * Tests the cache purging hooks that integrate with content update workflows.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachePurgingStatus,
  handleBulkPageUpdate,
  handlePageUpdate,
  handleSiteUpdate,
  isCachePurgingConfigured,
} from '../../../src/lib/server/content-hooks';
import type { Site } from '../../../src/schemas/SiteSchema';

// Mock the cache purger
const mockPurgePageCache = vi.fn();
const mockPurgeTags = vi.fn();
const mockIsConfigured = vi.fn();
const mockGetConfigStatus = vi.fn();

vi.mock('../../../src/lib/server/netlify-cache', () => ({
  NetlifyCachePurger: class {
    purgePageCache = mockPurgePageCache;
    purgeTags = mockPurgeTags;
    isConfigured = mockIsConfigured;
    getConfigStatus = mockGetConfigStatus;
  },
}));

// Mock the log helpers (we'll skip detailed log testing for now)
vi.mock('../../../src/utils/logHelpers', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe('Content Update Hooks', () => {
  const mockSite: Site = {
    key: 'test-site',
    flowTime: 1234567890000,
    name: 'Test Site',
    homepage: 'front-page',
    owners: ['user1'],
    hidden: false,
    sortOrder: 'name',
    system: 'homebrew',
    license: 'homebrew',
    customPageKeys: false,
    usePlainTextURLs: false,
    useSidebar: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assets: [],
    description: 'A test site for unit testing',
    characterKeeperSheetKey: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('handlePageUpdate', () => {
    it('should purge cache for regular page update', async () => {
      mockPurgePageCache.mockResolvedValueOnce([
        { success: true },
        { success: true },
      ]);

      await handlePageUpdate('test-site', 'some-page', mockSite);

      expect(mockPurgePageCache).toHaveBeenCalledWith(
        'test-site',
        'some-page',
        false,
      );
    });

    it('should purge cache for homepage update', async () => {
      mockPurgePageCache.mockResolvedValueOnce([
        { success: true },
        { success: true },
      ]);

      await handlePageUpdate('test-site', 'front-page', mockSite);

      expect(mockPurgePageCache).toHaveBeenCalledWith(
        'test-site',
        'front-page',
        true,
      );
    });

    it('should skip purging when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);

      await handlePageUpdate('test-site', 'some-page', mockSite);

      expect(mockPurgePageCache).not.toHaveBeenCalled();
    });
  });

  describe('handleSiteUpdate', () => {
    it('should purge site-wide cache tags', async () => {
      mockPurgeTags.mockResolvedValueOnce({
        success: true,
        tags: ['site-test-site', 'homepage-test-site'],
      });

      await handleSiteUpdate('test-site', mockSite);

      expect(mockPurgeTags).toHaveBeenCalledWith([
        'site-test-site',
        'homepage-test-site',
      ]);
    });
  });

  describe('handleBulkPageUpdate', () => {
    it('should purge cache for multiple pages', async () => {
      const pageKeys = ['page1', 'page2', 'front-page'];
      mockPurgeTags.mockResolvedValueOnce({
        success: true,
      });

      await handleBulkPageUpdate('test-site', pageKeys, mockSite);

      expect(mockPurgeTags).toHaveBeenCalledWith([
        'site-test-site',
        'page-test-site-page1',
        'page-test-site-page2',
        'page-test-site-front-page',
        'homepage-test-site', // Added because front-page is homepage
      ]);
    });
  });

  describe('Configuration utilities', () => {
    it('should return true when cache purging is configured', () => {
      mockIsConfigured.mockReturnValue(true);

      const result = isCachePurgingConfigured();

      expect(result).toBe(true);
    });

    it('should return configuration status', () => {
      const mockStatus = {
        configured: true,
        siteId: true,
        apiToken: true,
      };
      mockGetConfigStatus.mockReturnValue(mockStatus);

      const result = getCachePurgingStatus();

      expect(result).toEqual(mockStatus);
    });
  });
});
