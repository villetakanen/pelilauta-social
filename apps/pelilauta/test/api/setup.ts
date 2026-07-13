/**
 * API Test Setup
 *
 * This module sets up the test environment for API testing.
 * It provides utilities for making authenticated requests and managing test data.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { type App, cert, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  type Firestore,
  getFirestore,
} from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment configuration
config({
  path: '.env.development',
});

let serverApp: App;
let serverDB: Firestore;
let serverAuth: Auth;

/**
 * Initialize Firebase Admin SDK for testing
 */
export function initializeTestFirebase() {
  if (serverApp) {
    return { serverApp, serverDB, serverAuth };
  }

  try {
    const serviceAccountPath = join(__dirname, '../../server_principal.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    serverApp = initializeApp(
      {
        credential: cert(serviceAccount),
        databaseURL: process.env.PUBLIC_databaseURL,
      },
      'test-app',
    );

    serverDB = getFirestore(serverApp);
    serverAuth = getAuth(serverApp);

    return { serverApp, serverDB, serverAuth };
  } catch (error) {
    console.error('Failed to initialize Firebase for testing:', error);
    throw error;
  }
}

/**
 * Test user UIDs for different scenarios
 */
export const TEST_USERS = {
  NORMAL: 'H3evfU7BDmec9KkotRiTV41YECg1', // ville.takanen@iki.fi test user
  FROZEN: 'test-frozen-user-uid',
  ADMIN: 'vN8RyOYratXr80130A7LqVCLmLn1',
} as const;

/**
 * Create a test user account in Firestore
 */
export async function createTestAccount(
  uid: string,
  options: { frozen?: boolean } = {},
) {
  const { serverDB } = initializeTestFirebase();

  const accountData = {
    uid,
    eulaAccepted: true,
    lastLogin: FieldValue.serverTimestamp(),
    lightMode: 'light',
    updatedAt: FieldValue.serverTimestamp(),
    language: 'fi',
    frozen: options.frozen || false,
  };

  await serverDB.collection('account').doc(uid).set(accountData);
  return accountData;
}

/**
 * Generate a custom token for a test user and exchange it for an ID token
 */
export async function getTestToken(uid: string): Promise<string> {
  const { serverAuth } = initializeTestFirebase();

  // Create a custom token
  const customToken = await serverAuth.createCustomToken(uid);

  // We need to exchange this custom token for an ID token using Firebase Auth
  // This requires the Firebase client SDK in a Node.js environment

  try {
    // Import Firebase client auth dynamically
    const { signInWithCustomToken, getAuth } = await import('firebase/auth');
    const { initializeApp, getApps } = await import('firebase/app');

    // Initialize Firebase client app if not already done
    // biome-ignore lint/suspicious/noImplicitAnyLet: Firebase app type is complex in dynamic imports
    let clientApp;
    const existingApps = getApps();
    const testClientApp = existingApps.find(
      (app) => app.name === 'test-client',
    );

    if (testClientApp) {
      clientApp = testClientApp;
    } else {
      // Initialize with test project config (from server_principal.json)
      clientApp = initializeApp(
        {
          apiKey: process.env.TEST_FIREBASE_API_KEY,
          authDomain: process.env.TEST_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.TEST_FIREBASE_PROJECT_ID,
          storageBucket: process.env.TEST_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.TEST_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.TEST_FIREBASE_APP_ID,
        },
        'test-client',
      );
    }

    const auth = getAuth(clientApp);

    // Sign in with the custom token to get an ID token
    const userCredential = await signInWithCustomToken(auth, customToken);
    const idToken = await userCredential.user.getIdToken();

    return idToken;
  } catch (error) {
    console.error('Error exchanging custom token for ID token:', error);
    throw new Error(`Failed to generate test ID token: ${error}`);
  }
}

/**
 * Create authenticated headers for API requests
 */
export async function getAuthHeaders(
  uid: string,
): Promise<Record<string, string>> {
  const token = await getTestToken(uid);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create multipart form data headers for file uploads
 */
export async function getMultipartAuthHeaders(
  uid: string,
): Promise<Record<string, string>> {
  const token = await getTestToken(uid);
  return {
    Authorization: `Bearer ${token}`,
    // Note: Content-Type will be set automatically by fetch when using FormData
  };
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData() {
  const { serverDB } = initializeTestFirebase();

  try {
    // Clean up test threads
    const threadsQuery = await serverDB
      .collection('stream')
      .where('channel', '==', 'test-channel')
      .get();

    const batch = serverDB.batch();
    for (const doc of threadsQuery.docs) {
      batch.delete(doc.ref);

      // Also clean up reactions
      try {
        batch.delete(serverDB.collection('reactions').doc(doc.id));
      } catch {
        // Ignore if reactions don't exist
      }

      // Clean up tags
      try {
        batch.delete(serverDB.collection('tags').doc(doc.id));
      } catch {
        // Ignore if tags don't exist
      }
    }

    await batch.commit();
  } catch (error) {
    console.warn('Error during test cleanup:', error);
  }
}

/**
 * Get the test server base URL
 */
export function getTestServerUrl(): string {
  return process.env.TEST_SERVER_URL || 'http://localhost:4321';
}

/**
 * Make an API request to the test server
 */
export async function makeApiRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const baseUrl = getTestServerUrl();
  const url = `${baseUrl}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });
}

/**
 * Create a test thread data object
 */
export function createTestThreadData(overrides: Record<string, string> = {}) {
  return {
    title: 'Test Thread Title',
    markdownContent: '# Test Thread\n\nThis is a test thread content.',
    channel: 'test-channel',
    public: 'true',
    tags: JSON.stringify(['test', 'api']),
    ...overrides,
  };
}

/**
 * Create FormData for thread creation with files
 */
export function createThreadFormData(
  threadData: Record<string, string>,
  files: File[] = [],
): FormData {
  const formData = new FormData();

  // Add thread data
  for (const [key, value] of Object.entries(threadData)) {
    formData.append(key, value);
  }

  // Add files
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  return formData;
}
