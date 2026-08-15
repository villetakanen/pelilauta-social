/**
 * cleanup-test-db.mjs — sweep test material from the shared test database.
 *
 * Generalizes e2e/cleanup-test-threads.js from e2e threads to everything the
 * automated runs leave behind: e2e-titled threads, and any thread or site whose
 * title carries the `QA:` prefix that agents/qa personas are required to use.
 * The fixtures e2e/init-test-db.js seeds are kept by an explicit list.
 *
 * Dry run by default — prints what it would delete. Pass --apply to delete.
 *
 * Run: node apps/pelilauta/scripts/cleanup-test-db.mjs [--apply]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

config({ path: join(__dirname, '../.env') });

const apply = process.argv.includes('--apply');

const serviceAccount = JSON.parse(
  readFileSync(join(repoRoot, 'server_principal.json'), 'utf8'),
);
console.log('Using project_id:', serviceAccount.project_id);
console.log(
  apply ? 'APPLY mode: deleting.' : 'Dry run: pass --apply to delete.',
);

const serverDB = getFirestore(
  initializeApp(
    {
      credential: cert(serviceAccount),
      databaseURL: process.env.PUBLIC_databaseURL,
    },
    'cleanup-test-db',
  ),
);

// Fixtures seeded by e2e/init-test-db.js; never swept.
const KEPT_SITES = new Set(['e2e-test-site', 'e2e-public-test-site']);

const QA_PREFIX = 'QA:';

/** Title heuristics carried over from e2e/cleanup-test-threads.js. */
function isE2eThreadTitle(title) {
  return (
    title.includes('E2E Test Thread') ||
    title.includes('Test Thread for Reply') ||
    title.includes('Validation Test Thread') ||
    title.includes('Background Test Thread') ||
    title.includes('Complete Page') ||
    (title.includes('Test Thread') && title.includes('File Reply'))
  );
}

async function deleteThreadWithSubcollections(threadKey) {
  const batch = serverDB.batch();
  const replies = await serverDB
    .collection('stream')
    .doc(threadKey)
    .collection('replies')
    .get();
  for (const reply of replies.docs) {
    batch.delete(reply.ref);
    batch.delete(serverDB.collection('reactions').doc(reply.id));
  }
  batch.delete(serverDB.collection('reactions').doc(threadKey));
  batch.delete(serverDB.collection('tags').doc(threadKey));
  batch.delete(serverDB.collection('stream').doc(threadKey));
  await batch.commit();
}

async function deleteSiteWithSubcollections(siteRef) {
  for (const sub of await siteRef.listCollections()) {
    const docs = await sub.get();
    const batch = serverDB.batch();
    for (const doc of docs.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  await siteRef.delete();
}

async function sweepThreads() {
  const snapshot = await serverDB.collection('stream').get();
  const doomed = snapshot.docs.filter((doc) => {
    const title = doc.data().title || '';
    return title.startsWith(QA_PREFIX) || isE2eThreadTitle(title);
  });
  console.log(`Threads to delete: ${doomed.length}`);
  for (const doc of doomed) {
    console.log(`  - ${doc.data().title} (${doc.id})`);
    if (apply) await deleteThreadWithSubcollections(doc.id);
  }
  return doomed.length;
}

async function sweepSites() {
  const snapshot = await serverDB.collection('sites').get();
  const doomed = snapshot.docs.filter(
    (doc) =>
      !KEPT_SITES.has(doc.id) && (doc.data().name || '').startsWith(QA_PREFIX),
  );
  console.log(`Sites to delete: ${doomed.length}`);
  for (const doc of doomed) {
    console.log(`  - ${doc.data().name} (${doc.id})`);
    if (apply) await deleteSiteWithSubcollections(doc.ref);
  }
  return doomed.length;
}

/** Carried over from e2e/cleanup-test-threads.js: counts drift after deletes. */
async function updateChannelCounts() {
  const metaRef = serverDB.collection('meta').doc('threads');
  const meta = await metaRef.get();
  const topics = meta.data()?.topics ?? [];
  for (const channel of topics) {
    const threads = await serverDB
      .collection('stream')
      .where('channel', '==', channel.slug)
      .where('public', '==', true)
      .get();
    channel.threadCount = threads.size;
  }
  await metaRef.update({ topics });
  console.log('Channel thread counts updated.');
}

const deleted = (await sweepThreads()) + (await sweepSites());
if (apply && deleted > 0) {
  await updateChannelCounts();
}
console.log(
  apply ? `Sweep complete: ${deleted} deleted.` : 'Dry run complete.',
);
