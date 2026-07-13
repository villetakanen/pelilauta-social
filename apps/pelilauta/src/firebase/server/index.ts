// import { logWarn } from 'src/utils/logHelpers';
import type { ServiceAccount } from 'firebase-admin';
import admin from 'firebase-admin';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// const activeApps = getApps();
const serviceAccount = {
  type: 'service_account',
  project_id: import.meta.env.PUBLIC_projectId,
  private_key_id: import.meta.env.SECRET_private_key_id,
  private_key: import.meta.env.SECRET_private_key,
  client_email: import.meta.env.SECRET_client_email,
  client_id: import.meta.env.SECRET_client_id,
  auth_uri: import.meta.env.SECRET_auth_uri,
  token_uri: import.meta.env.SECRET_token_uri,
  auth_provider_x509_cert_url: import.meta.env
    .SECRET_auth_provider_x509_cert_url,
  client_x509_cert_url: import.meta.env.SECRET_client_x509_cert_url,
  universe_domain: import.meta.env.PUBLIC_universe_domain,
};

const initApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }
  // logWarn('Initializing the Firebase Server App');
  return initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    databaseURL: import.meta.env.PUBLIC_databaseURL,
    storageBucket: import.meta.env.PUBLIC_storageBucket,
  });
};

export const serverApp = initApp(); // activeApps.length === 0 ? initApp() : activeApps[0];
export const serverDB = getFirestore(serverApp);
export const serverAuth = getAuth(serverApp);
