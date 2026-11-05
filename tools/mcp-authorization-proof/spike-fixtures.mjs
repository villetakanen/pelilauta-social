import { randomBytes, randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import {
  CLAUDE_CODE_CALLBACK,
  CLAUDE_CODE_CLIENT_ID,
} from '../../apps/pelilauta/src/site/server/mcp/environment.mjs';
import { validateFirestoreEnvironment } from './firestore-guards.mjs';
import { PURPOSE } from './firestore-store.mjs';

export const ORIGIN = 'https://pelilauta-mcp-proof-7f42d9.netlify.app';
export const SITE_ID = 'b5a31e13-8160-4921-89e2-f34735ed2bd7';
export const CLIENT_ID = 'mcp-proof-client';
export const CALLBACK = `${ORIGIN}/mcp/proof-callback`;
export const CLAUDE_CLIENT = {
  id: 'claude-cowork',
  name: 'Claude Cowork',
  redirectUris: ['https://claude.ai/api/mcp/auth_callback'],
};
export const CLAUDE_CODE_CLIENT = {
  id: CLAUDE_CODE_CLIENT_ID,
  name: 'Claude Code',
  redirectUris: [CLAUDE_CODE_CALLBACK],
};
export const SITE_KEYS = ['mcp-proof-214-a', 'mcp-proof-214-b'];
const root = fileURLToPath(new URL('../../', import.meta.url));
export const STATE_PATH = resolve(root, '.local/mcp-spike-state.json');
export const ENV_PATH = resolve(root, '.local/mcp-spike.env');

export function fixturePlan(namespace, users, now = Date.now()) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      namespace,
    ) ||
    users.length !== 2 ||
    users.some((uid) => typeof uid !== 'string' || !uid || uid.length > 128) ||
    new Set(users).size !== users.length
  )
    throw new Error('Invalid isolated fixture identity');
  return [
    {
      path: `mcpAuthorizationProof214/${namespace}`,
      data: { purpose: PURPOSE, createdAt: new Date(now) },
    },
    ...SITE_KEYS.flatMap((key, index) => {
      const name = `MCP proof ${index + 1}`;
      const marker = {
        mcpProofNamespace: namespace,
        mcpProofPurpose: 'site-mcp-spike-214',
      };
      return [
        {
          path: `sites/${key}`,
          data: {
            ...marker,
            name,
            description: 'Isolated read-only MCP authorization fixture.',
            owners: [users[0]],
            players: [users[1]],
            hidden: true,
            homepage: 'proof',
            system: 'homebrew',
            license: '0',
            flowTime: now,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            pageRefs: [{ key: 'proof', name, author: users[0], flowTime: now }],
          },
        },
        {
          path: `sites/${key}/pages/proof`,
          data: {
            ...marker,
            name,
            siteKey: key,
            owners: [users[0]],
            author: users[0],
            flowTime: now,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            markdownContent: `# ${name}\n\nHyvää päivää. Välkommen.\n\nIsolated fixture ${index + 1} for MCP authorization.`,
            htmlContent: `<h1>${name}</h1><p>Hyvää päivää. Välkommen.</p>`,
          },
        },
      ];
    }),
  ];
}

export async function prepareFixtures(env = process.env) {
  if (env.MCP_SPIKE_PREPARE !== 'true' || env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Explicit non-emulated fixture preparation required');
  const principal = await validateFirestoreEnvironment({
    ...env,
    MCP_PROOF_FIRESTORE: env.MCP_SPIKE_PREPARE,
  });
  const response = await fetch(`${ORIGIN}/api/test/firebase-config`);
  const live = response.ok ? await response.json() : null;
  const version = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  ).version;
  if (live?.projectId !== 'skaldbase-test' || live.version !== version)
    throw new Error('Deployed test-project preflight failed');
  for (const path of [STATE_PATH, ENV_PATH]) {
    try {
      await access(path);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(
      'Existing local MCP state requires inspection; refusing replacement',
    );
  }
  const { cert, initializeApp, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  const { existingUser, adminUser } = await import('../../credentials.ts');
  const app = initializeApp(
    { projectId: 'skaldbase-test', credential: cert(principal) },
    `mcp-fixtures-${randomUUID()}`,
  );
  try {
    const auth = getAuth(app);
    const accounts = await Promise.all(
      [existingUser, adminUser].map((user) => auth.getUserByEmail(user.email)),
    );
    if (accounts.some((account) => account.disabled))
      throw new Error('Fixture accounts must already exist and be enabled');
    const users = accounts.map((account) => account.uid);
    const namespace = randomUUID();
    const plan = fixturePlan(namespace, users);
    const clients = [
      {
        id: CLIENT_ID,
        name: 'Pelilauta verification client',
        redirectUris: [CALLBACK],
      },
      CLAUDE_CLIENT,
      CLAUDE_CODE_CLIENT,
    ];
    const state = {
      siteId: SITE_ID,
      origin: ORIGIN,
      namespace,
      users,
      clients,
      fixtureSites: SITE_KEYS,
      prepared: false,
    };
    const settings = {
      SECRET_MCP_SPIKE_ENABLED: 'true',
      PUBLIC_projectId: 'skaldbase-test',
      SECRET_MCP_SPIKE_ORIGIN: ORIGIN,
      SECRET_MCP_SPIKE_NAMESPACE: namespace,
      SECRET_MCP_SPIKE_SIGNING_SECRET: randomBytes(48).toString('base64url'),
      SECRET_MCP_SPIKE_CLIENTS: JSON.stringify(clients),
      SECRET_MCP_SPIKE_USERS: JSON.stringify(users),
    };
    const db = getFirestore(app);
    if (db.projectId !== 'skaldbase-test')
      throw new Error('Fixture backend mismatch');
    const existing = await db.getAll(...plan.map((item) => db.doc(item.path)));
    if (existing.some((doc) => doc.exists))
      throw new Error('Fixture path already exists; refusing overwrite');
    const envText = `${Object.entries(settings)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    const decoded = parse(envText);
    if (Object.entries(settings).some(([key, value]) => decoded[key] !== value))
      throw new Error('Fixture environment cannot round-trip safely');
    await mkdir(resolve(root, '.local'), { recursive: true });
    await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
      mode: 0o600,
      flag: 'wx',
    });
    await writeFile(ENV_PATH, envText, { mode: 0o600, flag: 'wx' });
    const batch = db.batch();
    for (const item of plan) batch.create(db.doc(item.path), item.data);
    await batch.commit();
    await writeFile(
      STATE_PATH,
      `${JSON.stringify({ ...state, prepared: true }, null, 2)}\n`,
      { mode: 0o600 },
    );
    console.log(
      JSON.stringify({
        project: db.projectId,
        fixtureSitesCreated: SITE_KEYS.length,
        pagesCreated: SITE_KEYS.length,
        namespaceCreated: true,
        existingAccountsReused: users.length,
        client: CLIENT_ID,
      }),
    );
  } finally {
    await deleteApp(app);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await prepareFixtures();
}
