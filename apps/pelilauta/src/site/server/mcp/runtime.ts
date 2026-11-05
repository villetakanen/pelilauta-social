import { createHash } from 'node:crypto';
import {
  fixtureSites,
  maximumGrantAgeMs,
  maximumPageBytes,
  namespaceCollection,
  type SpikeConfig,
} from './config';
import { loadRunStore } from './firestore.mjs';
import type { SpikeContext, SpikeDependencies } from './handler';
import type { GrantUser } from './oauth.mjs';

export async function spikeDependencies(
  config: SpikeConfig,
  context: SpikeContext,
): Promise<SpikeDependencies> {
  const { serverDB, serverAuth } = await import('../../../firebase/server');
  if (
    Reflect.get(serverDB, 'projectId') !== 'skaldbase-test' ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  ) {
    throw new Error('Invalid MCP test backend');
  }
  const namespace = serverDB
    .collection(namespaceCollection)
    .doc(config.namespace);
  const uidKey = (uid: string) =>
    createHash('sha256').update(uid).digest('hex');
  const verifyUser = async (user: GrantUser) => {
    if (
      !user ||
      !config.users.includes(user.id) ||
      !Number.isInteger(user.authTime) ||
      !Number.isInteger(user.grantedAt) ||
      user.grantedAt > Date.now() ||
      Date.now() - user.grantedAt >= maximumGrantAgeMs
    )
      return false;
    const [account, run] = await Promise.all([
      serverAuth.getUser(user.id).catch((error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'auth/user-not-found'
        )
          return null;
        throw error;
      }),
      namespace.get(),
    ]);
    if (!run.exists || run.data()?.purpose !== 'oauth-authorization-proof-214')
      return false;
    const cutoff = run.data()?.disconnections?.[uidKey(user.id)] ?? 0;
    if (typeof cutoff !== 'number' || !Number.isFinite(cutoff)) return false;
    return (
      account !== null &&
      !account.disabled &&
      user.authTime * 1000 >=
        Date.parse(account.tokensValidAfterTime ?? '1970-01-01T00:00:00Z') &&
      user.grantedAt > cutoff
    );
  };
  return {
    session: () => context.locals.resolveSession(),
    loadStore: () => loadRunStore(serverDB, namespace),
    verifyUser,
    disconnect: async (uid) => {
      await serverDB.runTransaction(async (transaction) => {
        const run = await transaction.get(namespace);
        if (
          !run.exists ||
          run.data()?.purpose !== 'oauth-authorization-proof-214'
        )
          throw new Error('Missing test namespace');
        transaction.update(namespace, {
          [`disconnections.${uidKey(uid)}`]: Date.now(),
        });
      });
    },
    readPage: async (uid, siteKey) => {
      if (
        !config.users.includes(uid) ||
        !fixtureSites.some((key) => key === siteKey)
      )
        return null;
      const siteRef = serverDB.collection('sites').doc(siteKey);
      return serverDB.runTransaction(async (transaction) => {
        const site = await transaction.get(siteRef);
        const data = site.data();
        if (
          !site.exists ||
          ![
            ...(Array.isArray(data?.owners) ? data.owners : []),
            ...(Array.isArray(data?.players) ? data.players : []),
          ].includes(uid)
        )
          return null;
        const page = await transaction.get(
          siteRef.collection('pages').doc('proof'),
        );
        const content = page.data();
        if (
          !page.exists ||
          typeof content?.name !== 'string' ||
          content.name.length > 200 ||
          typeof content?.markdownContent !== 'string' ||
          Buffer.byteLength(content.markdownContent, 'utf8') > maximumPageBytes
        )
          return null;
        return { title: content.name, markdown: content.markdownContent };
      });
    },
  };
}
