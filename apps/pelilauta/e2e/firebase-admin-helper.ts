import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin if not already initialized
function getAdminDb() {
  const apps = getApps();

  if (apps.length === 0) {
    const serviceAccountPath = join(__dirname, '../server_principal.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

export async function updateSiteInFirestore(
  siteKey: string,
  data: Record<string, unknown>,
) {
  const db = getAdminDb();
  // Filter out undefined values and replace them with FieldValue.delete()
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      cleanData[key] = FieldValue.delete();
    } else {
      cleanData[key] = value;
    }
  }
  await db.collection('sites').doc(siteKey).update(cleanData);
}

export async function getSiteFromFirestore(siteKey: string) {
  const db = getAdminDb();
  const doc = await db.collection('sites').doc(siteKey).get();
  return doc.data();
}
