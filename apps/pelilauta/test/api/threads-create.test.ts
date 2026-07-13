/**
 * API Tests for /api/threads/create endpoint
 *
 * These tests verify the thread creation API endpoint functionality,
 * including authentication, validation, file uploads, and error handling.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupTestData,
  createTestAccount,
  createTestThreadData,
  createThreadFormData,
  getMultipartAuthHeaders,
  initializeTestFirebase,
  makeApiRequest,
  TEST_USERS,
} from './setup';

describe('/api/threads/create', () => {
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
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing token');
    });

    it('should return 401 for invalid bearer token', async () => {
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        body: formData,
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or missing token');
    });
  });

  describe('Account Status Validation', () => {
    it('should return 403 for frozen accounts', async () => {
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.FROZEN);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account suspended');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for missing required fields', async () => {
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      // Test missing title
      let formData = new FormData();
      formData.append('markdownContent', 'Content');
      formData.append('channel', 'test-channel');

      let response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(400);
      let data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');

      // Test missing markdownContent
      formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('channel', 'test-channel');

      response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(400);
      data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');

      // Test missing channel
      formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('markdownContent', 'Content');

      response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(400);
      data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle invalid tags JSON gracefully', async () => {
      const threadData = createTestThreadData({
        tags: 'invalid-json',
      });
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      // Should still succeed but ignore invalid tags
      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
    });
  });

  describe('Thread Creation', () => {
    it('should create a basic thread successfully', async () => {
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(202); // Accepted

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
      expect(data.message).toBe('Thread created successfully');
      expect(typeof data.threadKey).toBe('string');
      expect(data.threadKey.length).toBeGreaterThan(0);
    });

    it('should create a thread with all optional fields', async () => {
      const threadData = createTestThreadData({
        siteKey: 'test-site',
        youtubeId: 'test-youtube-id',
        poster: 'https://example.com/poster.jpg',
        public: 'false',
      });
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
    });

    it('should create a thread with tags', async () => {
      const threadData = createTestThreadData({
        tags: JSON.stringify(['test', 'api', 'vitest']),
      });
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
    });
  });

  describe('File Upload', () => {
    it('should handle thread creation without files', async () => {
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData, []);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
    });

    it('should create a thread with image files', async () => {
      // Create a test image file (1x1 pixel PNG)
      const imageBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a, // PNG signature
        0x00,
        0x00,
        0x00,
        0x0d,
        0x49,
        0x48,
        0x44,
        0x52, // IHDR chunk
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x01, // 1x1 dimensions
        0x08,
        0x02,
        0x00,
        0x00,
        0x00,
        0x90,
        0x77,
        0x53, // bit depth, color type, etc.
        0xde,
        0x00,
        0x00,
        0x00,
        0x0c,
        0x49,
        0x44,
        0x41, // IDAT chunk
        0x54,
        0x08,
        0x99,
        0x01,
        0x01,
        0x00,
        0x00,
        0x00, // image data
        0xff,
        0xff,
        0x00,
        0x00,
        0x00,
        0x02,
        0x00,
        0x01, // more image data
        0xe2,
        0x21,
        0xbc,
        0x33,
        0x00,
        0x00,
        0x00,
        0x00, // end
        0x49,
        0x45,
        0x4e,
        0x44,
        0xae,
        0x42,
        0x60,
        0x82, // IEND chunk
      ]);

      const testFile = new File([imageBuffer], 'test-image.png', {
        type: 'image/png',
      });

      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData, [testFile]);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status !== 202) {
        const errorData = await response.json();
        console.error('File upload test error:', errorData);
      }

      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.threadKey).toBeDefined();
    }, 10000); // Increase timeout for file upload
  });

  describe('Response Time', () => {
    it('should respond within 1000ms for basic thread creation', async () => {
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const startTime = Date.now();

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(202);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1000ms (early response pattern)

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should create thread document in Firestore', async () => {
      const { serverDB } = initializeTestFirebase();

      const threadData = createTestThreadData({
        title: 'Persistence Test Thread',
        markdownContent: 'This thread should be persisted in Firestore',
      });
      const formData = createThreadFormData(threadData);
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);

      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers,
        body: formData,
      });

      expect(response.status).toBe(202);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Wait a bit for the document to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the thread was created in Firestore
      const threadDoc = await serverDB
        .collection('stream')
        .doc(data.threadKey)
        .get();
      expect(threadDoc.exists).toBe(true);

      const threadDocData = threadDoc.data();
      expect(threadDocData?.title).toBe('Persistence Test Thread');
      expect(threadDocData?.markdownContent).toBe(
        'This thread should be persisted in Firestore',
      );
      expect(threadDocData?.channel).toBe('test-channel');
      expect(threadDocData?.owners).toEqual([TEST_USERS.NORMAL]);
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking Firebase to simulate errors
      // For now, we'll test that our API returns proper error responses
      const threadData = createTestThreadData();
      const formData = createThreadFormData(threadData);

      // Use an invalid auth header format to trigger an error path
      const response = await makeApiRequest('/api/threads/create', {
        method: 'POST',
        headers: {
          Authorization: 'InvalidFormat',
        },
        body: formData,
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
