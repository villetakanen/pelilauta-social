export async function GET() {
  return new Response(
    JSON.stringify({
      apiKey: import.meta.env.PUBLIC_apiKey,
      authDomain: import.meta.env.PUBLIC_authDomain,
      projectId: import.meta.env.PUBLIC_projectId,
      storageBucket: import.meta.env.PUBLIC_storageBucket,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
