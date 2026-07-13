import { getAuth, type User } from 'firebase/auth';
import { app as firebaseApp } from '.';

const auth = getAuth(firebaseApp);

/**
 * A wrapper around the native fetch function that automatically adds the
 * Firebase Authentication ID token to the Authorization header for requests
 * to your backend API.
 *
 * @param input - The resource URL (like fetch).
 * @param options - The options for the request (like fetch).
 * @returns A Promise that resolves with the Response object.
 * @throws Throws an error if the user is not logged in or if fetching the token fails.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  options?: RequestInit,
): Promise<Response> {
  const currentUser: User | null = auth.currentUser;

  // 1. Check if user is logged in client-side
  if (!currentUser) {
    console.error('authedFetch: No user is currently logged in.');
    // You might want to redirect to login or throw a specific error type
    throw new Error('User not authenticated');
  }

  let idToken: string;
  try {
    // 2. Get the Firebase ID token
    // Note: getIdToken() automatically handles refreshing the token if it's expired.
    idToken = await currentUser.getIdToken();
  } catch (error) {
    console.error('authedFetch: Failed to get ID token:', error);
    // Handle token fetch error - maybe the user's session is invalid?
    throw new Error('Failed to retrieve authentication token');
  }

  // 3. Prepare headers
  const headers = new Headers(options?.headers); // Create Headers object from existing options
  headers.set('Authorization', `Bearer ${idToken}`); // Set the Authorization header

  // Ensure Content-Type is set for methods that typically have a body, if not already set
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json'); // Default to JSON, adjust if needed
  }

  // 4. Call the original fetch with the modified options
  try {
    let response = await fetch(input, {
      ...options, // Spread existing options (method, body, etc.)
      headers: headers, // Use the modified headers object
    });

    // 5. Token Repair Strategy (PBI-056)
    if (response.status === 401) {
      console.warn('authedFetch: 401 Unauthorized. Attempting token repair...');

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No user to refresh token for');

        // Force refresh the token
        const newToken = await currentUser.getIdToken(true);
        console.log(
          'authedFetch: Token refreshed successfully. Retrying request...',
        );

        // Update Authorization header with new token
        headers.set('Authorization', `Bearer ${newToken}`);

        // Retry the request
        response = await fetch(input, {
          ...options,
          headers: headers,
        });

        // Fail-safe: If retry also fails with 401, trigger logout
        if (response.status === 401) {
          console.error('authedFetch: Retry failed with 401. Logging out...');
          await auth.signOut();
          window.location.href = '/login';
          return response;
        }
      } catch (refreshError) {
        console.error('authedFetch: Token repair failed:', refreshError);
        console.warn(
          'authedFetch: Logging out due to unrecoverable auth state.',
        );
        await auth.signOut();
        window.location.href = '/login';
        throw refreshError;
      }
    }

    return response;
  } catch (error) {
    console.error('authedFetch: Network or fetch error:', error);
    // Re-throw the error so the calling code can handle it
    throw error;
  }
}

// --- Convenience methods for common HTTP verbs ---

export const authedGet = (input: RequestInfo | URL, options?: RequestInit) =>
  authedFetch(input, { ...options, method: 'GET' });

export const authedPost = (
  input: RequestInfo | URL,
  body: unknown,
  options?: RequestInit,
) =>
  authedFetch(input, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });

export const authedPut = (
  input: RequestInfo | URL,
  body: unknown,
  options?: RequestInit,
) =>
  authedFetch(input, { ...options, method: 'PUT', body: JSON.stringify(body) });

export const authedPatch = (
  input: RequestInfo | URL,
  body: unknown,
  options?: RequestInit,
) =>
  authedFetch(input, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const authedDelete = (
  input: RequestInfo | URL,
  body?: unknown,
  options?: RequestInit,
) =>
  authedFetch(input, {
    ...options,
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });
