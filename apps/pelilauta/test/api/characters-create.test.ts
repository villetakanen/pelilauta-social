/**
 * API Tests for /api/characters POST endpoint
 *
 * These tests verify the character creation API endpoint functionality,
 * including authentication, validation, and error handling.
 *
 * This replaces the old client-side character creation logic that was
 * previously in CreateCharacterForm.svelte and createCharacter.ts
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

describe('/api/characters', () => {
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
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const characterData = {
        name: 'Test Character',
        description: 'A test character',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should return 401 for invalid bearer token', async () => {
      const characterData = {
        name: 'Test Character',
        description: 'A test character',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for missing required name field', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        description: 'A character without a name',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid character data');
    });

    it('should return 400 for empty name field', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: '',
        description: 'A character with empty name',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid character data');
    });
  });

  describe('Character Creation', () => {
    it('should create a basic character successfully', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: 'Gandalf the Grey',
        description: 'A wise wizard from Middle-earth',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe('string');
      expect(data.id.length).toBeGreaterThan(0);
    });

    it('should create a character with optional fields', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: 'Aragorn',
        description: 'Ranger of the North, rightful king of Gondor',
        siteKey: 'middle-earth-campaign',
        avatar: 'https://example.com/aragorn.jpg',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.id).toBeDefined();
    });

    it('should create a character with sheetKey and stats', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: 'Legolas',
        description: 'Elven archer from the Woodland Realm',
        sheetKey: 'dnd5e-sheet',
        stats: {
          strength: 16,
          dexterity: 18,
        },
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.id).toBeDefined();

      // Verify the data in firestore
      const { serverDB } = initializeTestFirebase();
      const characterDoc = await serverDB
        .collection('characters')
        .doc(data.id)
        .get();
      expect(characterDoc.exists).toBe(true);
      const characterDocData = characterDoc.data();
      expect(characterDocData?.sheetKey).toBe('dnd5e-sheet');
      expect(characterDocData?.stats).toEqual({ strength: 16, dexterity: 18 });
    });
  });

  describe('Ownership', () => {
    it('should set the authenticated user as the owner', async () => {
      const { serverDB } = initializeTestFirebase();
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: 'Frodo Baggins',
        description: 'A brave hobbit on an important quest',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();

      // Wait a bit for the document to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the character was created in Firestore with correct ownership
      const characterDoc = await serverDB
        .collection('characters')
        .doc(data.id)
        .get();
      expect(characterDoc.exists).toBe(true);

      const characterDocData = characterDoc.data();
      expect(characterDocData?.name).toBe('Frodo Baggins');
      expect(characterDocData?.owners).toEqual([TEST_USERS.NORMAL]);
      expect(characterDocData?.author).toBe(TEST_USERS.NORMAL);
      expect(characterDocData?.createdAt).toBeDefined();
      expect(characterDocData?.updatedAt).toBeDefined();
      expect(characterDocData?.flowTime).toBeDefined();
    }, 5000);
  });

  describe('Response Time', () => {
    it('should respond within 500ms for basic character creation', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);
      const characterData = {
        name: 'Speed Test Character',
        description: 'Testing response time',
      };

      const startTime = Date.now();

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(characterData),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(500); // Should respond quickly

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const headers = await getAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers,
        body: 'invalid json',
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle server errors gracefully', async () => {
      // This would typically require mocking Firebase to simulate errors
      // For now, we test that invalid auth format triggers error path
      const characterData = {
        name: 'Error Test Character',
        description: 'Testing error handling',
      };

      const response = await makeApiRequest('/api/characters', {
        method: 'POST',
        headers: {
          Authorization: 'InvalidFormat',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      expect(response.status).toBe(401);
    });
  });
});
