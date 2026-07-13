/**
 * Unit tests for updateSiteApi client wrapper
 *
 * Tests the client-side wrapper that calls the PATCH /api/sites/[siteKey] endpoint.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSiteApi } from '../../../src/firebase/client/site/updateSiteApi';

// Mock response type for tests
interface MockResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

// Mock the apiClient module
vi.mock('../../../src/firebase/client/apiClient', () => ({
  authedPatch: vi.fn(),
}));

// Mock logHelpers
vi.mock('../../../src/utils/logHelpers', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe('updateSiteApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if site.key is missing', async () => {
    await expect(updateSiteApi({})).rejects.toThrow(
      'Site key is required to update site',
    );
  });

  it('should call PATCH /api/sites/[siteKey] with correct parameters', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await updateSiteApi({ key: 'test-site', name: 'Updated Name' });

    expect(authedPatch).toHaveBeenCalledWith('/api/sites/test-site', {
      name: 'Updated Name',
      silent: false,
    });
  });

  it('should pass silent flag to API', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await updateSiteApi(
      { key: 'test-site', sortOrder: 'manual' },
      true, // silent = true
    );

    expect(authedPatch).toHaveBeenCalledWith('/api/sites/test-site', {
      sortOrder: 'manual',
      silent: true,
    });
  });

  it('should exclude key from update data', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await updateSiteApi({
      key: 'test-site',
      name: 'New Name',
      description: 'New Description',
    });

    expect(authedPatch).toHaveBeenCalledWith('/api/sites/test-site', {
      name: 'New Name',
      description: 'New Description',
      silent: false,
    });
  });

  it('should handle successful API response', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await expect(
      updateSiteApi({ key: 'test-site', name: 'Updated' }),
    ).resolves.not.toThrow();
  });

  it('should throw error if API returns error response', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Validation failed' }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await expect(updateSiteApi({ key: 'test-site', name: '' })).rejects.toThrow(
      'Validation failed',
    );
  });

  it('should throw error with HTTP status if no error message in response', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await expect(
      updateSiteApi({ key: 'test-site', name: 'Test' }),
    ).rejects.toThrow('HTTP 500');
  });

  it('should handle malformed JSON error response', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await expect(
      updateSiteApi({ key: 'test-site', name: 'Test' }),
    ).rejects.toThrow('HTTP 500');
  });

  it('should handle network errors', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    vi.mocked(authedPatch).mockRejectedValue(new Error('Network error'));

    await expect(
      updateSiteApi({ key: 'test-site', name: 'Test' }),
    ).rejects.toThrow('Network error');
  });

  it('should update multiple fields at once', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await updateSiteApi({
      key: 'test-site',
      name: 'New Name',
      description: 'New Description',
      system: 'D&D 5e',
      hidden: true,
    });

    expect(authedPatch).toHaveBeenCalledWith('/api/sites/test-site', {
      name: 'New Name',
      description: 'New Description',
      system: 'D&D 5e',
      hidden: true,
      silent: false,
    });
  });

  it('should log debug messages on success', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const { logDebug } = await import('../../../src/utils/logHelpers');
    const mockResponse: MockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await updateSiteApi({ key: 'test-site', name: 'Test' });

    expect(logDebug).toHaveBeenCalledWith(
      'updateSiteApi',
      'Updating site via API',
      expect.objectContaining({
        siteKey: 'test-site',
        fields: ['name'],
        silent: false,
      }),
    );

    expect(logDebug).toHaveBeenCalledWith(
      'updateSiteApi',
      'Site updated successfully',
      expect.objectContaining({
        siteKey: 'test-site',
      }),
    );
  });

  it('should log error messages on failure', async () => {
    const { authedPatch } = await import(
      '../../../src/firebase/client/apiClient'
    );
    const { logError } = await import('../../../src/utils/logHelpers');
    const mockResponse: MockResponse = {
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: 'Forbidden' }),
    };
    vi.mocked(authedPatch).mockResolvedValue(mockResponse as Response);

    await expect(
      updateSiteApi({ key: 'test-site', name: 'Test' }),
    ).rejects.toThrow();

    expect(logError).toHaveBeenCalledWith(
      'updateSiteApi',
      'Failed to update site:',
      expect.any(Error),
    );
  });
});
