/**
 * This is a command line/node script that will clean up test threads from the test database.
 *
 * We use the Firestore settings in the .env.development file to connect to the Firestore database
 * of the end-to-end test project and remove threads created during testing.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({
  path: '.env.development',
});

// Use the service account file directly instead of environment variables
const serviceAccountPath = join(__dirname, '../server_principal.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

console.log('Using project_id:', serviceAccount.project_id);

const serverApp = initializeApp(
  {
    credential: cert(serviceAccount),
    databaseURL: process.env.PUBLIC_databaseURL,
  },
  'cleanup-app',
);

export const serverDB = getFirestore(serverApp);

/**
 * Delete a thread and all its related data (replies, reactions, etc.)
 * @param {string} threadKey - The key of the thread to delete
 */
async function deleteThreadWithSubcollections(threadKey) {
  const batch = serverDB.batch();

  console.log(`Deleting thread: ${threadKey}`);

  // Delete all replies
  const repliesSnapshot = await serverDB
    .collection('stream')
    .doc(threadKey)
    .collection('replies')
    .get();

  for (const replyDoc of repliesSnapshot.docs) {
    console.log(`  Deleting reply: ${replyDoc.id}`);
    batch.delete(replyDoc.ref);

    // Delete reaction data for this reply
    const reactionRef = serverDB.collection('reactions').doc(replyDoc.id);
    batch.delete(reactionRef);
  }

  // Delete thread reactions
  const threadReactionRef = serverDB.collection('reactions').doc(threadKey);
  batch.delete(threadReactionRef);

  // Delete thread tags
  const threadTagRef = serverDB.collection('tags').doc(threadKey);
  batch.delete(threadTagRef);

  // Finally delete the thread itself
  const threadRef = serverDB.collection('stream').doc(threadKey);
  batch.delete(threadRef);

  await batch.commit();
  console.log(`Thread ${threadKey} and all related data deleted successfully`);
}

/**
 * Clean up test threads created during E2E testing
 */
async function cleanupTestThreads() {
  console.log('Starting cleanup of test threads...');

  const currentTime = Date.now();
  const oneHourAgo = new Date(currentTime - 60 * 60 * 1000); // 1 hour ago

  // Find threads that look like test threads (title contains "E2E Test Thread" or "Test Thread")
  const testThreadQuery = await serverDB
    .collection('stream')
    .where('public', '==', true)
    .get();

  const threadsToDelete = [];

  for (const threadDoc of testThreadQuery.docs) {
    const data = threadDoc.data();
    const title = data.title || '';
    const createdAt = data.createdAt?.toDate() || new Date(0);

    // Check if this looks like a test thread
    const isTestThread =
      title.includes('E2E Test Thread') ||
      title.includes('Test Thread for Reply') ||
      title.includes('Validation Test Thread') ||
      title.includes('Background Test Thread') ||
      title.includes('Complete Page') ||
      (title.includes('Test Thread') && title.includes('File Reply'));

    // Only delete test threads that are older than 1 hour or explicitly marked for cleanup
    const isOldEnough = createdAt < oneHourAgo;
    const isMarkedForCleanup = data.markdownContent?.includes(
      'automatically cleaned up after the test runs',
    );

    if (isTestThread && (isOldEnough || isMarkedForCleanup)) {
      threadsToDelete.push({
        key: threadDoc.id,
        title: title,
        createdAt: createdAt,
      });
    }
  }

  if (threadsToDelete.length === 0) {
    console.log('No test threads found for cleanup');
    return;
  }

  console.log(`Found ${threadsToDelete.length} test threads to delete:`);
  for (const thread of threadsToDelete) {
    console.log(
      `  - ${thread.title} (${thread.key}) created at ${thread.createdAt.toISOString()}`,
    );
  }

  // Delete each thread with its subcollections
  for (const thread of threadsToDelete) {
    try {
      await deleteThreadWithSubcollections(thread.key);
    } catch (error) {
      console.error(`Error deleting thread ${thread.key}:`, error);
    }
  }

  console.log('Test thread cleanup completed');
}

/**
 * Update channel thread counts after cleanup
 */
async function updateChannelCounts() {
  console.log('Updating channel thread counts...');

  try {
    const channelsDoc = await serverDB.collection('meta').doc('threads').get();

    if (!channelsDoc.exists()) {
      console.log('No channels document found, skipping count update');
      return;
    }

    const channelsData = channelsDoc.data();
    const channelsArray = channelsData?.topics || [];

    // Count actual threads for each channel
    for (const channel of channelsArray) {
      const threadCount = await serverDB
        .collection('stream')
        .where('channel', '==', channel.slug)
        .where('public', '==', true)
        .get();

      channel.threadCount = threadCount.size;
      console.log(
        `  Channel "${channel.name}" (${channel.slug}): ${channel.threadCount} threads`,
      );
    }

    // Update the channels document
    await serverDB.collection('meta').doc('threads').update({
      topics: channelsArray,
    });

    console.log('Channel thread counts updated successfully');
  } catch (error) {
    console.error('Error updating channel counts:', error);
  }
}

// Main execution
async function main() {
  try {
    await cleanupTestThreads();
    await updateChannelCounts();
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
