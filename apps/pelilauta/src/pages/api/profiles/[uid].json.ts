import type { APIContext } from 'astro';
import {
  PROFILES_COLLECTION_NAME,
  parseProfile,
} from 'src/schemas/ProfileSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { serverDB } from '../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
  const { uid } = params;

  if (!uid) {
    return new Response('Invalid request', { status: 400 });
  }

  const profileDoc = await serverDB
    .collection(PROFILES_COLLECTION_NAME)
    .doc(uid)
    .get();

  const data = profileDoc.data();

  if (!profileDoc.exists || !data) {
    return new Response('Profile not found', { status: 404 });
  }

  const profile = parseProfile(toClientEntry(data), uid);

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  });
}
