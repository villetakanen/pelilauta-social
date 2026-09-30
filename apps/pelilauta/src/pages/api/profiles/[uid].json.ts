import type { APIContext } from 'astro';
import { getProfileData } from 'src/firebase/server/profiles';

export async function GET({ params }: APIContext): Promise<Response> {
  const { uid } = params;

  if (!uid) {
    return new Response('Invalid request', { status: 400 });
  }

  const profile = await getProfileData(uid);

  if (!profile) {
    return new Response('Profile not found', { status: 404 });
  }

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  });
}
