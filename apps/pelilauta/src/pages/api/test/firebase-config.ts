import { version } from '@root/package.json';

export async function GET() {
  return new Response(
    JSON.stringify({
      apiKey: import.meta.env.PUBLIC_apiKey,
      authDomain: import.meta.env.PUBLIC_authDomain,
      projectId: import.meta.env.PUBLIC_projectId,
      storageBucket: import.meta.env.PUBLIC_storageBucket,
      // The running application's own repository version, so an e2e
      // fixture reset can refuse against a stale dev server instead of
      // trusting a process that never picked up a merge.
      version,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
