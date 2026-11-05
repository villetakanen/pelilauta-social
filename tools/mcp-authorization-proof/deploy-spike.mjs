import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { spikeConfig } from '../../apps/pelilauta/src/site/server/mcp/config.ts';
import { validateFirestoreEnvironment } from './firestore-guards.mjs';
import { ENV_PATH, ORIGIN, SITE_ID, STATE_PATH } from './spike-fixtures.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const accountId = '639085310c8c2405c899496c';
if (process.env.MCP_SPIKE_DEPLOY !== 'true')
  throw new Error('Explicit test deployment opt-in required');
await validateFirestoreEnvironment({
  ...process.env,
  MCP_PROOF_FIRESTORE: process.env.MCP_SPIKE_DEPLOY,
});
const state = JSON.parse(await readFile(STATE_PATH, 'utf8'));
const settings = parse(await readFile(ENV_PATH, 'utf8'));
const local = parse(
  await readFile(resolve(root, 'apps/pelilauta/.env'), 'utf8'),
);
const config = spikeConfig(settings);
if (
  !state.prepared ||
  state.siteId !== SITE_ID ||
  state.origin !== ORIGIN ||
  !config ||
  config.issuer !== ORIGIN ||
  config.namespace !== state.namespace ||
  JSON.stringify(config.users) !== JSON.stringify(state.users) ||
  local.PUBLIC_projectId !== 'skaldbase-test' ||
  !local.SECRET_client_email?.endsWith(
    '@skaldbase-test.iam.gserviceaccount.com',
  )
)
  throw new Error('Local test deployment guard failed');
const linkPath = resolve(root, 'apps/pelilauta/.netlify/state.json');
const originalLink = JSON.parse(await readFile(linkPath, 'utf8')).siteId;
if (originalLink === SITE_ID)
  throw new Error('Unexpected linked proof project; inspect local state');
const env = { ...process.env, ...local, ...settings, NETLIFY_SITE_ID: SITE_ID };
delete env.URL;
delete env.DEPLOY_PRIME_URL;
function netlify(args) {
  try {
    return execFileSync('netlify', args, {
      cwd: root,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch {
    throw new Error(
      `Scoped Netlify ${args[0]} operation failed; credentials suppressed`,
    );
  }
}
const site = JSON.parse(
  netlify(['api', 'getSite', '--data', JSON.stringify({ site_id: SITE_ID })]),
);
if (site.id !== SITE_ID || site.ssl_url !== ORIGIN)
  throw new Error('Remote proof project mismatch');
const variables = JSON.parse(
  netlify([
    'api',
    'getEnvVars',
    '--data',
    JSON.stringify({ account_id: accountId, site_id: SITE_ID }),
  ]),
);
const remote = Object.fromEntries(
  variables.map((row) => [
    row.key,
    row.values?.find((value) => value.context === 'all')?.value,
  ]),
);
for (const key of [
  'PUBLIC_projectId',
  'PUBLIC_apiKey',
  'PUBLIC_authDomain',
  'PUBLIC_appId',
  'SECRET_client_email',
  'SECRET_private_key',
]) {
  if (!local[key] || remote[key] !== local[key])
    throw new Error(`Remote Firebase configuration mismatch for ${key}`);
}
netlify(['env:import', ENV_PATH, '--site', SITE_ID, '--filter', 'pelilauta']);
netlify([
  'env:set',
  'SECRET_MCP_SPIKE_SIGNING_SECRET',
  '--secret',
  '--site',
  SITE_ID,
  '--filter',
  'pelilauta',
  '--force',
]);
const build = spawnSync('pnpm', ['--filter', 'pelilauta', 'build'], {
  cwd: root,
  env,
  stdio: 'inherit',
});
if (build.error || build.status !== 0)
  throw new Error('Test-project build failed');
const deploy = JSON.parse(
  netlify([
    'deploy',
    '--site',
    SITE_ID,
    '--filter',
    'pelilauta',
    '--no-build',
    '--prod',
    '--message',
    'MCP 214 enabled isolated authorization proof',
    '--json',
  ]),
);
if (deploy.site_id !== SITE_ID || deploy.url !== ORIGIN)
  throw new Error('Deployment target mismatch');
if (JSON.parse(await readFile(linkPath, 'utf8')).siteId !== originalLink)
  throw new Error('Local project link changed');
const live = await fetch(`${ORIGIN}/api/test/firebase-config`);
if (!live.ok || (await live.json()).projectId !== 'skaldbase-test')
  throw new Error('Deployed Firebase project mismatch');
for (const [path, expected] of [
  ['/.well-known/oauth-authorization-server', 200],
  ['/.well-known/oauth-protected-resource/mcp', 200],
  ['/mcp', 401],
]) {
  const response = await fetch(`${ORIGIN}${path}`);
  if (
    response.status !== expected ||
    response.headers.get('cache-control') !== 'no-store'
  )
    throw new Error(`Deployed route check failed for ${path}`);
}
console.log(
  JSON.stringify({
    siteId: SITE_ID,
    deployId: deploy.deploy_id,
    origin: ORIGIN,
    connectorEnabled: true,
    anonymousAccessRejected: true,
    productionLinkUnchanged: true,
  }),
);
