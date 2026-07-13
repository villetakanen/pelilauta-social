/**
 * Converts a sesion firebase bearer token to a valid uid
 * */
export async function tokenToUid(request: Request): Promise<string | null> {
  const { serverAuth } = await import('../../../firebase/server');

  // 1. Get Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Auth failed: Missing or invalid Authorization header.');
    return null;
  }

  // 2. Extract Token
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    console.warn('Auth failed: Token missing after "Bearer ".');
    return null;
  }

  // 3. Verify Firebase ID Token
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken, true);
    return decodedToken.uid;
  } catch (error) {
    console.warn('Auth failed: Invalid or expired token:', error);
    return null;
  }
}
