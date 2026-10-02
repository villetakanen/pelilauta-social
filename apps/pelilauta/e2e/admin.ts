import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

/**
 * Provides Firebase Admin SDK access for tests that mutate replies while a
 * page is open.
 *
 * `e2e/reset-fixtures.mjs` restores fixtures before test execution. Tests
 * publishing or deleting replies mid-run perform mutations through this
 * module, verifying the project target before connecting.
 */

const REQUIRED_PROJECT_ID = 'skaldbase-test';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(__filename), '../../..');

let cached: Firestore | null = null;

/** Returns the `skaldbase-test` Firestore instance, or throws an error when targeting another project. */
export function adminFirestore(): Firestore {
  if (cached) return cached;

  const serviceAccountPath = join(repoRoot, 'server_principal.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  if (serviceAccount.project_id !== REQUIRED_PROJECT_ID) {
    throw new Error(
      `server_principal.json targets project "${serviceAccount.project_id}", not "${REQUIRED_PROJECT_ID}".`,
    );
  }

  const app =
    getApps().find((candidate) => candidate.name === 'e2e-admin') ??
    initializeApp({ credential: cert(serviceAccount) }, 'e2e-admin');
  cached = getFirestore(app);
  return cached;
}

/** Returns the `comments` subcollection reference for a thread. */
export function replies(threadKey: string) {
  return adminFirestore()
    .collection('stream')
    .doc(threadKey)
    .collection('comments');
}

/** Deletes a reply document from the thread comments subcollection. */
export async function deleteReply(
  threadKey: string,
  replyKey: string,
): Promise<void> {
  await replies(threadKey).doc(replyKey).delete();
}
