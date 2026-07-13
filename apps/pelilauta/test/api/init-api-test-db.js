/**
 * API Test Database Initialization Script
 *
 * This script initializes the test database with necessary data for API testing.
 * It should be run before API tests to ensure a clean test environment.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({
  path: '.env.development',
});

// Use the service account file directly
const serviceAccountPath = join(__dirname, '../../server_principal.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

console.log(
  'Initializing API test database for project:',
  serviceAccount.project_id,
);

const serverApp = initializeApp(
  {
    credential: cert(serviceAccount),
    databaseURL: process.env.PUBLIC_databaseURL,
  },
  'api-test-init',
);

export const serverDB = getFirestore(serverApp);

// Test user UIDs
const TEST_USERS = {
  NORMAL: 'H3evfU7BDmec9KkotRiTV41YECg1', // ville.takanen@iki.fi test user
  FROZEN: 'test-frozen-user-uid',
  ADMIN: 'vN8RyOYratXr80130A7LqVCLmLn1',
};

// Clean up any existing test data
console.log('Cleaning up existing test data...');

// Clean up test threads
try {
  const threadsQuery = await serverDB
    .collection('stream')
    .where('channel', '==', 'test-channel')
    .get();

  if (!threadsQuery.empty) {
    console.log(
      `Deleting ${threadsQuery.docs.length} existing test threads...`,
    );
    const batch = serverDB.batch();

    for (const doc of threadsQuery.docs) {
      batch.delete(doc.ref);

      // Also clean up related collections
      try {
        batch.delete(serverDB.collection('reactions').doc(doc.id));
      } catch {
        // Ignore if doesn't exist
      }

      try {
        batch.delete(serverDB.collection('tags').doc(doc.id));
      } catch {
        // Ignore if doesn't exist
      }
    }

    await batch.commit();
    console.log('Test threads cleaned up.');
  }
} catch (error) {
  console.warn('Error cleaning up test threads:', error);
}

// Create test accounts
console.log('Creating test accounts...');

// Normal test account
await serverDB.collection('account').doc(TEST_USERS.NORMAL).set({
  uid: TEST_USERS.NORMAL,
  eulaAccepted: true,
  lastLogin: FieldValue.serverTimestamp(),
  lightMode: 'light',
  updatedAt: FieldValue.serverTimestamp(),
  language: 'fi',
  frozen: false,
});
console.log('Created normal test account:', TEST_USERS.NORMAL);

// Frozen test account
await serverDB.collection('account').doc(TEST_USERS.FROZEN).set({
  uid: TEST_USERS.FROZEN,
  eulaAccepted: true,
  lastLogin: FieldValue.serverTimestamp(),
  lightMode: 'light',
  updatedAt: FieldValue.serverTimestamp(),
  language: 'fi',
  frozen: true,
});
console.log('Created frozen test account:', TEST_USERS.FROZEN);

// Admin test account
await serverDB.collection('account').doc(TEST_USERS.ADMIN).set({
  uid: TEST_USERS.ADMIN,
  eulaAccepted: true,
  lastLogin: FieldValue.serverTimestamp(),
  lightMode: 'light',
  updatedAt: FieldValue.serverTimestamp(),
  language: 'fi',
  frozen: false,
});
console.log('Created admin test account:', TEST_USERS.ADMIN);

// Create test profiles
console.log('Creating test profiles...');

await serverDB.collection('profiles').doc(TEST_USERS.NORMAL).set({
  uid: TEST_USERS.NORMAL,
  nick: 'Test User',
  username: 'test-user',
  avatarUrl: '',
  bio: 'Test user for API testing',
  frozen: false,
});

await serverDB.collection('profiles').doc(TEST_USERS.FROZEN).set({
  uid: TEST_USERS.FROZEN,
  nick: 'Frozen User',
  username: 'frozen-user',
  avatarUrl: '',
  bio: 'Frozen test user',
  frozen: true,
});

await serverDB.collection('profiles').doc(TEST_USERS.ADMIN).set({
  uid: TEST_USERS.ADMIN,
  nick: 'Admin User',
  username: 'admin-user',
  avatarUrl: '',
  bio: 'Admin test user',
  frozen: false,
});

console.log('Test profiles created.');

// Create test sites
console.log('Creating test sites...');

const testSiteKey = 'test-site-normal-user';
await serverDB
  .collection('sites')
  .doc(testSiteKey)
  .set({
    key: testSiteKey,
    name: 'Test Site for Normal User',
    owners: [TEST_USERS.NORMAL],
    hidden: false,
    sortOrder: 'name',
    system: 'mekanismi',
    flowTime: Date.now(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    description: 'A test site owned by the normal test user',
    posterURL: '',
    avatarURL: '',
    pageRefs: [],
    pageCategories: [],
  });

const testSiteKey2 = 'test-site-normal-user-2';
await serverDB
  .collection('sites')
  .doc(testSiteKey2)
  .set({
    key: testSiteKey2,
    name: 'Another Test Site',
    owners: [TEST_USERS.NORMAL],
    hidden: false,
    sortOrder: 'created',
    system: 'dnd5e',
    flowTime: Date.now() - 1000,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    description: 'Another test site for testing',
    posterURL: '',
    avatarURL: '',
    pageRefs: [],
    pageCategories: [],
  });

const hiddenSiteKey = 'test-site-hidden';
await serverDB
  .collection('sites')
  .doc(hiddenSiteKey)
  .set({
    key: hiddenSiteKey,
    name: 'Hidden Test Site',
    owners: [TEST_USERS.NORMAL],
    hidden: true,
    sortOrder: 'name',
    system: 'homebrew',
    flowTime: Date.now() - 2000,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    description: 'A hidden test site that should not appear in public listings',
    posterURL: '',
    avatarURL: '',
    pageRefs: [],
    pageCategories: [],
  });

const adminSiteKey = 'test-site-admin';
await serverDB
  .collection('sites')
  .doc(adminSiteKey)
  .set({
    key: adminSiteKey,
    name: 'Admin Test Site',
    owners: [TEST_USERS.ADMIN],
    hidden: false,
    sortOrder: 'name',
    system: 'mekanismi',
    flowTime: Date.now() - 3000,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    description: 'A test site owned by admin user',
    posterURL: '',
    avatarURL: '',
    pageRefs: [],
    pageCategories: [],
  });

console.log('Test sites created.');

// Create test channels in meta/threads if they don't exist
console.log('Setting up test channels...');

try {
  const channelsRef = serverDB.collection('meta').doc('threads');
  const channelsDoc = await channelsRef.get();

  let channelsData = { topics: [] };

  if (channelsDoc.exists) {
    channelsData = channelsDoc.data() || { topics: [] };
  }

  // Ensure test-channel exists
  const testChannelExists = channelsData.topics.some(
    (c) => c.slug === 'test-channel',
  );

  if (!testChannelExists) {
    channelsData.topics.push({
      slug: 'test-channel',
      name: 'Test Channel',
      description: 'Channel for API testing',
      threadCount: 0,
      sortOrder: 999,
    });

    await channelsRef.set(channelsData);
    console.log('Added test-channel to meta/threads');
  } else {
    console.log('test-channel already exists in meta/threads');
  }
} catch (error) {
  console.warn('Error setting up test channels:', error);
}

// Wait a bit to ensure all writes are committed
await new Promise((resolve) => setTimeout(resolve, 1000));

console.log('API test database initialization complete!');
console.log('Test users created:');
console.log('  Normal user:', TEST_USERS.NORMAL);
console.log('  Frozen user:', TEST_USERS.FROZEN);
console.log('  Admin user:', TEST_USERS.ADMIN);
console.log('Ready for API testing!');
