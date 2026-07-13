import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Replace with your service account key file path
import serviceAccount from '../server_principal.json' with { type: 'json' };

async function fixCreationDates() {
  console.log('Starting to fix creation dates...');
  try {
    // Initialize Firebase Admin SDK
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: 'https://skaldbase.firebaseio.com',
    });

    const db = getFirestore();

    const threadsWithCreated = db
      .collection('stream')
      .where('created', '!=', null);

    // All of these threads potentially miss the `createdAt` field, and have the legacy `created` field.
    const snapshot = await threadsWithCreated.get();
    if (snapshot.empty) {
      console.log('No threads found with the "created" field.');
      return;
    }
    console.log(`Found ${snapshot.size} threads with the "created" field.`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.created && !data.createdAt) {
        // If the `created` field exists but `createdAt` does not, copy the value
        await doc.ref.update({
          createdAt: data.created,
        });
        console.log(`Updated thread ${doc.id} with createdAt: ${data.created}`);
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return;
  }
}

fixCreationDates();
