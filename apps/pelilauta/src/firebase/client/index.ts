/**
 * Client side firebase configuration and app initialization
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_apiKey,
  authDomain: import.meta.env.PUBLIC_authDomain,
  databaseURL: import.meta.env.PUBLIC_databaseURL,
  projectId: import.meta.env.PUBLIC_projectId,
  storageBucket: import.meta.env.PUBLIC_storageBucket,
  messagingSenderId: import.meta.env.PUBLIC_messagingSenderId,
  appId: import.meta.env.PUBLIC_appId,
  measurementId: import.meta.env.PUBLIC_measurementId,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// export const storage = getStorage(app);
