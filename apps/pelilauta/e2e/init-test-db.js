/**
 * This is a command line/node script that will initialize the test database with the necessary data.
 *
 * We use the Firestore settings in the .env.development file to connect to the Firestore database
 * of the end-to-end test project.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({
  path: '.env.development',
});

// Use the service account file directly instead of environment variables
const serviceAccountPath = join(__dirname, '../server_principal.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

console.log('Using project_id:', serviceAccount.project_id);

const serverApp = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.PUBLIC_databaseURL,
});

export const serverDB = getFirestore(serverApp);
export const serverAuth = getAuth(serverApp);

// Create a test site
const testSite = {
  key: 'e2e-test-site',
  name: 'The E2E Test Site',
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: FieldValue.serverTimestamp(),
  owners: [
    'e2e-test-owner',
    'JatmZFE8X9coxETMz2sUs5YW1r22',
    'vN8RyOYratXr80130A7LqVCLmLn1',
    'H3evfU7BDmec9KkotRiTV41YECg1', // ville.takanen@iki.fi test user
  ],
  homepage: 'front-page',
  hidden: true,
  sortOrder: 'name',
  usePlainTextURLs: true,
  pageCategories: [
    { slug: 'alpha', name: 'Alpha' },
    { slug: 'beta', name: 'Beta' },
    { slug: 'omega', name: 'Omega' },
  ],
  pageRefs: [
    {
      key: 'front-page',
      name: 'Front Page',
      author: 'e2e-test-owner',
      category: 'alpha',
      flowTime: 0,
    },
  ],
};
await serverDB.collection('sites').doc(testSite.key).set(testSite);
console.log('Test site created:', testSite.key);
console.log('Site owners:', testSite.owners);

// Create a public test site for sitemap testing
const publicTestSite = {
  key: 'e2e-public-test-site',
  name: 'The E2E Public Test Site',
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: FieldValue.serverTimestamp(),
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
  homepage: 'public-page',
  hidden: false, // Public site for sitemap testing
  sortOrder: 'name',
  usePlainTextURLs: true,
  pageCategories: [{ slug: 'general', name: 'General' }],
  pageRefs: [
    {
      key: 'public-page',
      name: 'Public Page',
      author: 'e2e-test-owner',
      category: 'general',
      flowTime: 0,
    },
    {
      key: 'another-public-page',
      name: 'Another Public Page',
      author: 'e2e-test-owner',
      category: 'general',
      flowTime: 0,
    },
  ],
};
await serverDB.collection('sites').doc(publicTestSite.key).set(publicTestSite);
console.log('Public test site created:', publicTestSite.key);

// Create pages for the public test site
const publicTestPage = {
  key: 'public-page',
  siteKey: publicTestSite.key,
  name: 'Public Page',
  createdAt: FieldValue.serverTimestamp(),
  markdownContent:
    '# Public Page\n\nThis is a public page for sitemap testing.',
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
  category: 'general',
  tags: ['e2e', 'public', 'sitemap'],
};
await serverDB
  .collection('sites')
  .doc(publicTestSite.key)
  .collection('pages')
  .doc(publicTestPage.key)
  .set(publicTestPage);
console.log('Public test page created:', publicTestPage.key);

const anotherPublicTestPage = {
  key: 'another-public-page',
  siteKey: publicTestSite.key,
  name: 'Another Public Page',
  createdAt: FieldValue.serverTimestamp(),
  markdownContent:
    '# Another Public Page\n\nAnother public page for sitemap testing.',
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
  category: 'general',
  tags: ['e2e', 'public', 'sitemap'],
};
await serverDB
  .collection('sites')
  .doc(publicTestSite.key)
  .collection('pages')
  .doc(anotherPublicTestPage.key)
  .set(anotherPublicTestPage);
console.log('Another public test page created:', anotherPublicTestPage.key);

const testSitePages = await serverDB
  .collection('sites')
  .doc(testSite.key)
  .collection('pages')
  .get();
if (testSitePages.empty) {
  console.log('No pages found for the test site, creating default pages.');
} else {
  console.log('Test site already has pages, deleting existing pages.');
  const batch = serverDB.batch();
  for (const doc of testSitePages.docs) {
    console.log('Deleting page:', doc.id);
    batch.delete(doc.ref);
  }
  await batch.commit();
}

// Create a test site front page
const testSiteFrontPage = {
  key: 'front-page',
  siteKey: testSite.key,
  name: 'Front Page',
  createdAt: FieldValue.serverTimestamp(),
  markdownContent: "# Welcome to the E2E Test Site!\n\n here's the front page",
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
  category: 'alpha',
  tags: ['e2e', 'test'],
};
await serverDB
  .collection('sites')
  .doc(testSite.key)
  .collection('pages')
  .doc(testSiteFrontPage.key)
  .set(testSiteFrontPage);
console.log('Test site front page created:', testSiteFrontPage.key);

// Create a regular test page for cache testing
const testPage = {
  key: 'test-page',
  siteKey: testSite.key,
  name: 'Test Page',
  createdAt: FieldValue.serverTimestamp(),
  markdownContent:
    '# Test Page\n\nThis is a regular test page for cache header testing.',
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
  category: 'alpha',
  tags: ['e2e', 'test', 'cache'],
};
await serverDB
  .collection('sites')
  .doc(testSite.key)
  .collection('pages')
  .doc(testPage.key)
  .set(testPage);
console.log('Test page created:', testPage.key);

// Wait a bit to ensure all writes are committed
await new Promise((resolve) => setTimeout(resolve, 1000));

console.log('Database initialization complete, fire away!');

// Cleanup test user for account creation flow test
const testUserUid = 'H3evfU7BDmec9KkotRiTV41YECg1';
console.log(`Cleaning up user ${testUserUid} for account creation test...`);

// 1. Clear custom claims
await serverAuth.setCustomUserClaims(testUserUid, {});
console.log('Custom claims cleared.');

// 2. Delete account document
const accountRef = serverDB.collection('accounts').doc(testUserUid);
await accountRef.delete();
console.log('Account document deleted.');

// 3. Delete profile document
const profileRef = serverDB.collection('profiles').doc(testUserUid);
await profileRef.delete();
console.log('Profile document deleted.');

// Create a test character sheet
const testSheet = {
  key: 'e2e-test-sheet',
  name: 'E2E Test Sheet',
  system: 'homebrew',
  stats: [
    {
      key: 'text_stat',
      type: 'text',
      value: 'initial text',
      group: 'Test Group',
    },
    {
      key: 'number_stat',
      type: 'number',
      value: 10,
      group: 'Test Group',
    },
    {
      key: 'toggled_stat',
      type: 'toggled',
      value: false,
      group: 'Test Group',
    },
  ],
  statGroups: ['Test Group'],
};
await serverDB.collection('charsheets').doc(testSheet.key).set(testSheet);
console.log('Test character sheet created:', testSheet.key);

// Create a test site for the keeper
const keeperTestSite = {
  key: 'e2e-keeper-test-site',
  name: 'The E2E Keeper Test Site',
  system: 'homebrew', // Explicitly set system to match test character sheet
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: FieldValue.serverTimestamp(),
  owners: [
    'e2e-test-owner',
    'JatmZFE8X9coxETMz2sUs5YW1r22',
    'vN8RyOYratXr80130A7LqVCLmLn1',
    'H3evfU7BDmec9KkotRiTV41YECg1', // ville.takanen@iki.fi test user
  ],
  homepage: 'front-page',
  hidden: true,
  sortOrder: 'name',
  usePlainTextURLs: true,
  useCharacters: true,
  useCharacterKeeper: true,
  characterKeeperSheetKey: 'e2e-test-sheet',
};
await serverDB.collection('sites').doc(keeperTestSite.key).set(keeperTestSite);
console.log('Keeper test site created:', keeperTestSite.key);

// Create a character for the keeper test site
const keeperTestCharacter = {
  key: 'e2e-keeper-test-character',
  name: 'E2E Keeper Test Character',
  siteKey: keeperTestSite.key,
  sheetKey: 'e2e-test-sheet',
  owners: ['e2e-test-owner', 'H3evfU7BDmec9KkotRiTV41YECg1'],
};
await serverDB
  .collection('characters')
  .doc(keeperTestCharacter.key)
  .set(keeperTestCharacter);
console.log('Keeper test character created:', keeperTestCharacter.key);

// Create app metadata with admin configuration
const appMeta = {
  admins: [
    'vN8RyOYratXr80130A7LqVCLmLn1', // sator@iki.fi - test admin user
  ],
  version: '1.0.0',
  updatedAt: FieldValue.serverTimestamp(),
};
await serverDB.collection('meta').doc('pelilauta').set(appMeta);
console.log(
  'App metadata created with admin user: vN8RyOYratXr80130A7LqVCLmLn1',
);

console.log('User cleanup complete.');

// Create the admin user if they don't exist
const adminUid = 'vN8RyOYratXr80130A7LqVCLmLn1';
const adminEmail = 'sator@iki.fi';
const adminPassword = 'test-test-test';

try {
  await serverAuth.getUser(adminUid);
  console.log('Admin user already exists:', adminUid);
} catch {
  console.log('Admin user not found, creating...');
  await serverAuth.createUser({
    uid: adminUid,
    email: adminEmail,
    password: adminPassword,
    displayName: 'Test Admin',
  });
  console.log('Admin user created:', adminUid);
}

// Create/update profile document for admin user (required for E2E tests with programmatic auth)
// Note: This is a DIFFERENT user than H3evfU7BDmec9KkotRiTV41YECg1 which is used for
// account creation tests and intentionally has no profile
const adminProfile = {
  uid: adminUid,
  nick: 'TestAdmin',
  email: adminEmail,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  avatarURL: '',
  bio: 'E2E Test Admin User',
};
await serverDB
  .collection('profiles')
  .doc(adminUid)
  .set(adminProfile, { merge: true });
console.log('Admin profile document created/updated:', adminUid);

// Create account document for admin user
const adminAccount = {
  uid: adminUid,
  email: adminEmail,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};
await serverDB
  .collection('accounts')
  .doc(adminUid)
  .set(adminAccount, { merge: true });
console.log('Admin account document created/updated:', adminUid);

console.log('✅ Test database initialization complete!');
