import type { Page } from '@playwright/test';

interface Credentials {
  email: string;
  password: string;
}

interface FirebaseAuthResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
}

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

/**
 * Fetch Firebase configuration from the test API endpoint
 */
async function getFirebaseConfig(): Promise<FirebaseConfig> {
  const response = await fetch(`${BASE_URL}/api/test/firebase-config`);
  if (!response.ok) {
    throw new Error('Failed to fetch Firebase config from test API');
  }
  return response.json();
}

/**
 * Authenticate a user programmatically using Firebase REST API
 * This is faster and more reliable than UI-based authentication for E2E tests
 *
 * @param page - Playwright page instance
 * @param credentials - User email and password
 */
export async function authenticateProgrammatic(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  console.log(`Authenticating programmatically: ${credentials.email}`);

  // Get Firebase API key from the test endpoint
  const config = await getFirebaseConfig();
  const apiKey = config.apiKey;

  // Step 1: Call Firebase REST API to sign in
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firebase authentication failed: ${error}`);
  }

  const authData: FirebaseAuthResponse = await response.json();

  // Step 2: Construct Firebase localStorage structure
  const localStorageKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
  const expirationTime = Date.now() + parseInt(authData.expiresIn) * 1000;

  const authUser = {
    uid: authData.localId,
    email: authData.email,
    emailVerified: true,
    isAnonymous: false,
    providerData: [
      {
        providerId: 'password',
        uid: authData.email,
        displayName: null,
        email: authData.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: authData.refreshToken,
      accessToken: authData.idToken,
      expirationTime,
    },
    createdAt: Date.now().toString(),
    lastLoginAt: Date.now().toString(),
    apiKey,
    appName: '[DEFAULT]',
  };

  // Step 3: Inject auth state into page localStorage before navigation
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: localStorageKey, value: authUser },
  );

  console.log(
    `✓ Programmatic authentication successful for ${credentials.email}`,
  );
}
