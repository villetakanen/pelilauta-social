import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Replace with your service account key file path
import serviceAccount from '../server_principal.json' with { type: 'json' };

// Replace with your desired download directory
const downloadDirectory = './firebase-backup';

async function downloadAllFiles() {
  try {
    // Initialize Firebase Admin SDK
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'skaldbase.appspot.com',
    });

    const storage = getStorage();
    const bucket = storage.bucket();

    // Get all files in the bucket
    const [files] = await bucket.getFiles();

    // Create the download directory if it doesn't exist
    await fs.mkdir(downloadDirectory, { recursive: true });

    // Download each file
    for (const file of files) {
      const filePath = path.join(downloadDirectory, file.name);
      const fileDir = path.dirname(filePath);

      // Create directories for nested files
      await fs.mkdir(fileDir, { recursive: true });

      await file.download({ destination: filePath });
      console.log(`Downloaded: ${file.name}`);
    }

    console.log('All files downloaded successfully!');
  } catch (error) {
    console.error('Error downloading files:', error);
  }
}

downloadAllFiles();
