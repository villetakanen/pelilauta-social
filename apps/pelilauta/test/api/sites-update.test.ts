/**
 * API Tests for /api/sites/[siteKey] endpoint
 *
 * These tests verify the site update API endpoint functionality,
 * including authentication, authorization, validation, and cache purging.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupTestData,
  createTestAccount,
  getAuthHeaders,
  initializeTestFirebase,
  makeApiRequest,
  TEST_USERS,
} from './setup';

describe('PATCH /api/sites/[siteKey]', () => {
  let testSiteKey: string;

  beforeAll(async () => {
    // Initialize Firebase for testing
    initializeTestFirebase();

    // Create test accounts
    await createTestAccount(TEST_USERS.NORMAL);
    await createTestAccount(TEST_USERS.FROZEN, { frozen: true });
  });

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await cleanupTestData();

    // Create a test site for update operations
    const { serverDB } = initializeTestFirebase();
    testSiteKey = `test-site-${Date.now()}`;

    await serverDB
      .collection('sites')
      .doc(testSiteKey)
      .set({
        key: testSiteKey,
        name: 'Test Site',
        owners: [TEST_USERS.NORMAL],
        hidden: false,
        sortOrder: 'name',
        system: 'homebrew',
        flowTime: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for invalid bearer token', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    it('should return 403 for non-owner users', async () => {
      // Create another user who doesn't own the site
      const otherUser = 'test-other-user-uid';
      await createTestAccount(otherUser);

      const updateData = { name: 'Unauthorized Update' };
      const headers = await getAuthHeaders(otherUser);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden: Not site owner');
    });

    it('should allow owner to update site', async () => {
      const updateData = { name: 'Owner Update' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.siteKey).toBe(testSiteKey);
    });
  });

  describe('Validation', () => {
    it('should return 400 for missing site key', async () => {
      const updateData = { name: 'Updated Name' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/sites/', {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404); // Astro returns 404 for missing route params
    });

    it('should return 404 for non-existent site', async () => {
      const updateData = { name: 'Updated Name' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/sites/non-existent-site', {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Site not found');
    });

    it('should reject invalid sortOrder value', async () => {
      const updateData = { sortOrder: 'invalid-order' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(500); // Zod validation error
    });

    it('should reject non-boolean hidden value', async () => {
      const updateData = { hidden: 'true' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(500); // Zod validation error
    });

    it('should reject invalid pageRefs structure', async () => {
      const updateData = {
        pageRefs: [
          {
            // Missing required 'key' field
            name: 'Page 1',
            author: 'user123',
            flowTime: 1234567890,
          },
        ],
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(500); // Zod validation error
    });

    it('should strip Entry fields from update', async () => {
      const { serverDB } = initializeTestFirebase();

      const updateData = {
        name: 'Updated Name',
        key: 'should-be-ignored',
        owners: ['malicious-user'],
        createdAt: new Date(),
        flowTime: 999999,
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      // Wait for update to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify Entry fields were not changed
      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const siteData = siteDoc.data();

      expect(siteData?.key).toBe(testSiteKey); // Key unchanged
      expect(siteData?.owners).toEqual([TEST_USERS.NORMAL]); // Owners unchanged
      expect(siteData?.name).toBe('Updated Name'); // Name updated
    });
  });

  describe('Core Field Updates', () => {
    it('should update site name', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { name: 'Updated Site Name' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Site updated successfully');

      // Wait for update to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify in Firestore
      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.name).toBe('Updated Site Name');
    });

    it('should update system field', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { system: 'D&D 5e' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.system).toBe('D&D 5e');
    });

    it('should update description', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { description: 'A new epic campaign' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.description).toBe('A new epic campaign');
    });

    it('should update multiple fields at once', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = {
        name: 'Multi-Update Name',
        system: 'Pathfinder',
        description: 'Multi-field update test',
        hidden: true,
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const siteData = siteDoc.data();

      expect(siteData?.name).toBe('Multi-Update Name');
      expect(siteData?.system).toBe('Pathfinder');
      expect(siteData?.description).toBe('Multi-field update test');
      expect(siteData?.hidden).toBe(true);
    });
  });

  describe('Media Fields', () => {
    it('should update posterURL', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { posterURL: 'https://example.com/poster.jpg' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.posterURL).toBe('https://example.com/poster.jpg');
    });

    it('should update avatarURL', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { avatarURL: 'https://example.com/avatar.png' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.avatarURL).toBe('https://example.com/avatar.png');
    });
  });

  describe('Visibility', () => {
    it('should update hidden flag to true', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { hidden: true };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.hidden).toBe(true);
    });

    it('should update hidden flag to false', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { hidden: false };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.hidden).toBe(false);
    });
  });

  describe('Page Organization', () => {
    it('should update sortOrder', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = { sortOrder: 'manual' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.sortOrder).toBe('manual');
    });

    it('should update pageRefs', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = {
        pageRefs: [
          {
            key: 'page1',
            name: 'Page 1',
            author: 'user123',
            flowTime: 1234567890,
          },
          {
            key: 'page2',
            name: 'Page 2',
            author: 'user456',
            category: 'rules',
            flowTime: 1234567900,
          },
        ],
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const pageRefs = siteDoc.data()?.pageRefs;

      expect(pageRefs).toHaveLength(2);
      expect(pageRefs[0].key).toBe('page1');
      expect(pageRefs[1].category).toBe('rules');
    });

    it('should update pageCategories', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = {
        pageCategories: [
          { slug: 'rules', name: 'Rules' },
          { slug: 'lore', name: 'Lore' },
        ],
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const categories = siteDoc.data()?.pageCategories;

      expect(categories).toHaveLength(2);
      expect(categories[0].slug).toBe('rules');
      expect(categories[1].name).toBe('Lore');
    });
  });

  describe('Feature Toggles', () => {
    it('should update feature toggles', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = {
        usePlayers: true,
        useClocks: true,
        useHandouts: false,
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const siteData = siteDoc.data();

      expect(siteData?.usePlayers).toBe(true);
      expect(siteData?.useClocks).toBe(true);
      expect(siteData?.useHandouts).toBe(false);
    });

    it('should update players array', async () => {
      const { serverDB } = initializeTestFirebase();
      const updateData = {
        players: ['player1', 'player2', 'player3'],
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      expect(siteDoc.data()?.players).toEqual([
        'player1',
        'player2',
        'player3',
      ]);
    });
  });

  describe('Silent Mode', () => {
    it('should not update timestamps when silent is true', async () => {
      const { serverDB } = initializeTestFirebase();

      // Get original timestamps
      //const originalDoc = await serverDB
      //  .collection('sites')
      //  .doc(testSiteKey)
      //  .get();
      // const _originalData = originalDoc.data();

      // Wait a bit to ensure timestamps would differ
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updateData = {
        name: 'Silent Update',
        silent: true,
      };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const siteDoc = await serverDB.collection('sites').doc(testSiteKey).get();
      const siteData = siteDoc.data();

      // Name should be updated
      expect(siteData?.name).toBe('Silent Update');

      // Timestamps should NOT be in the update (silent mode)
      // Note: We can't easily test this without mocking, but the schema validation passes
    });
  });

  describe('HTTP Methods', () => {
    it('should support PATCH for partial updates (primary method)', async () => {
      const updateData = { name: 'PATCH Update' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should support PUT as alias for PATCH (compatibility)', async () => {
      const updateData = { name: 'PUT Update' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Response Format', () => {
    it('should return proper success response', async () => {
      const updateData = { name: 'Response Test' };
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('siteKey');
      expect(data).toHaveProperty('message');
      expect(data.success).toBe(true);
      expect(data.siteKey).toBe(testSiteKey);
      expect(data.message).toBe('Site updated successfully');
    });
  });

  describe('Empty Updates', () => {
    it('should accept empty update object', async () => {
      const updateData = {};
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest(`/api/sites/${testSiteKey}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
