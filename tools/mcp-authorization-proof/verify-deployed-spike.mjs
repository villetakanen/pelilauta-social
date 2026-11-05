import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { parse } from 'dotenv';
import { validateFirestoreEnvironment } from './firestore-guards.mjs';
import {
  CALLBACK,
  CLAUDE_CLIENT,
  CLIENT_ID,
  ENV_PATH,
  ORIGIN,
  SITE_ID,
  SITE_KEYS,
  STATE_PATH,
} from './spike-fixtures.mjs';

class ProofFailure extends Error {}
function check(condition, message) {
  if (!condition) throw new ProofFailure(message);
}
if (process.env.MCP_SPIKE_VERIFY !== 'true')
  throw new Error('Explicit deployed verification opt-in required');
check(
  !process.env.FIREBASE_AUTH_EMULATOR_HOST,
  'Auth emulator redirection is forbidden',
);
const principal = await validateFirestoreEnvironment({
  ...process.env,
  MCP_PROOF_FIRESTORE: process.env.MCP_SPIKE_VERIFY,
});
const state = JSON.parse(await readFile(STATE_PATH, 'utf8'));
const settings = parse(await readFile(ENV_PATH, 'utf8'));
check(
  state.prepared &&
    state.siteId === SITE_ID &&
    state.origin === ORIGIN &&
    state.namespace === settings.SECRET_MCP_SPIKE_NAMESPACE,
  'Invalid local proof state',
);
const liveResponse = await fetch(`${ORIGIN}/api/test/firebase-config`);
const live = liveResponse.ok ? await liveResponse.json() : null;
check(
  live?.projectId === 'skaldbase-test',
  'Deployed project preflight failed',
);
const { cert, initializeApp, deleteApp } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const { existingUser } = await import('../../credentials.ts');
const app = initializeApp(
  { projectId: 'skaldbase-test', credential: cert(principal) },
  `mcp-live-${randomUUID()}`,
);
const db = getFirestore(app);
const refs = SITE_KEYS.flatMap((key) => [
  db.doc(`sites/${key}`),
  db.doc(`sites/${key}/pages/proof`),
]);
let cookie;
let browser;
let page;
const navigation = [];
let before;
let cleaned = false;
let stage = 'fixture preflight';
async function documents() {
  const docs = await db.getAll(...refs);
  check(
    docs.every(
      (doc) => doc.exists && doc.data().mcpProofNamespace === state.namespace,
    ),
    'Fixture marker mismatch',
  );
  return docs.map((doc) => ({ path: doc.ref.path, data: doc.data() }));
}
async function disconnect() {
  const page = await fetch(`${ORIGIN}/mcp/disconnect`, {
    headers: { Cookie: cookie },
  });
  check(page.ok, 'Disconnect consent unavailable');
  const proof = /name="proof" value="([^"]+)"/.exec(await page.text())?.[1];
  check(proof, 'Disconnect form proof missing');
  const result = await fetch(`${ORIGIN}/mcp/disconnect`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ proof, decision: 'approve' }),
  });
  check(result.ok, 'Disconnect failed');
}
async function token(body) {
  return fetch(`${ORIGIN}/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}
async function rpc(access, method, params) {
  const response = await fetch(`${ORIGIN}/mcp`, {
    method: 'POST',
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-11-25',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const text = await response.text();
  let body;
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    const data = text
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => JSON.parse(line.slice(5)));
    body = data.find((message) => message.id === 1);
  } else {
    try {
      body = JSON.parse(text);
    } catch {}
  }
  return { response, body };
}

try {
  before = await documents();
  for (const method of ['initialize', 'tools/list', 'tools/call']) {
    const { response } = await rpc(null, method);
    check(
      response.status === 401 &&
        response.headers.get('cache-control') === 'no-store',
      'Anonymous MCP access was not rejected',
    );
  }
  for (const path of [
    '/.netlify/functions/ssr',
    '/.netlify/functions/ssr/mcp',
  ]) {
    const response = await fetch(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    check(
      [401, 403, 404].includes(response.status),
      'Direct function entry exposed MCP',
    );
  }
  stage = 'Firebase sign-in';
  const signedIn = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(live.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: existingUser.email,
        password: existingUser.password,
        returnSecureToken: true,
      }),
    },
  );
  check(signedIn.ok, 'Dedicated test-account Firebase sign-in failed');
  const identity = await signedIn.json();
  check(
    identity.localId === state.users[0] && typeof identity.idToken === 'string',
    'Signed-in test identity mismatch',
  );
  stage = 'session creation';
  const session = await fetch(`${ORIGIN}/api/auth/session`, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: identity.idToken }),
  });
  check(session.ok, 'Real Firebase session creation failed');
  cookie = session.headers
    .getSetCookie()
    .find((value) => value.startsWith('session='))
    ?.split(';')[0];
  check(cookie, 'Verified session cookie missing');
  const status = await fetch(`${ORIGIN}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  check(
    status.ok && (await status.json()).uid === state.users[0],
    'Server session verification failed',
  );
  stage = 'browser setup';
  browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: 'session',
      value: cookie.slice('session='.length),
      url: ORIGIN,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);
  page = await context.newPage();
  page.on('response', (response) => {
    if (response.request().isNavigationRequest())
      navigation.push({
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
  });
  page.on('console', (message) => {
    if (message.type() === 'error')
      navigation.push({
        browserError: message.text().includes('Content Security Policy')
          ? 'CSP'
          : 'other',
      });
  });
  let returned;
  page.on('response', (response) => {
    if (
      response.status() === 302 &&
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/mcp/authorize'
    ) {
      const location = response.headers().location;
      if (location) returned = new URL(location);
    }
  });
  async function authorize() {
    stage = 'browser consent';
    returned = undefined;
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const requestState = randomUUID();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK,
      resource: `${ORIGIN}/mcp`,
      scope: 'mcp:read',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: requestState,
    });
    const claudeParams = new URLSearchParams(params);
    claudeParams.set('client_id', CLAUDE_CLIENT.id);
    claudeParams.set('redirect_uri', CLAUDE_CLIENT.redirectUris[0]);
    const claudePage = await fetch(`${ORIGIN}/mcp/authorize?${claudeParams}`, {
      headers: { Cookie: cookie },
    });
    check(
      claudePage.ok &&
        claudePage.headers
          .get('content-security-policy')
          ?.includes("form-action 'self' https://claude.ai;"),
      'Registered Claude consent or callback policy failed',
    );
    check(
      (await claudePage.text()).includes('claude.ai'),
      'Consent omits the callback hostname',
    );
    const document = await page.goto(`${ORIGIN}/mcp/authorize?${params}`, {
      waitUntil: 'domcontentloaded',
    });
    check(document?.status() === 200, 'Browser consent page unavailable');
    await page
      .getByRole('heading', { name: 'Allow read-only MCP access' })
      .waitFor();
    await page
      .getByRole('button', { name: 'Allow read-only access', exact: true })
      .click({ noWaitAfter: true });
    await page.waitForURL(
      (url) => url.origin === ORIGIN && url.pathname === '/mcp/proof-callback',
      { waitUntil: 'domcontentloaded' },
    );
    check(
      returned?.searchParams.get('state') === requestState,
      'OAuth state mismatch',
    );
    const code = returned.searchParams.get('code');
    check(code, 'Authorization code missing');
    stage = 'code exchange';
    const response = await token(
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: CALLBACK,
        resource: `${ORIGIN}/mcp`,
        code_verifier: verifier,
        code,
      }),
    );
    check(
      response.ok && response.headers.get('cache-control') === 'no-store',
      'Originless real code exchange failed',
    );
    const grant = await response.json();
    check(
      typeof grant.access_token === 'string' &&
        typeof grant.refresh_token === 'string',
      'Token response malformed',
    );
    return grant;
  }
  const grant = await authorize();
  stage = 'MCP initialization';
  const initialization = await rpc(grant.access_token, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'pelilauta-proof-client', version: '0.0.0' },
  });
  check(
    initialization.response.ok &&
      initialization.body?.result?.serverInfo?.name === 'pelilauta-214-spike',
    'Authenticated MCP initialization failed',
  );
  stage = 'tool discovery';
  const listing = await rpc(grant.access_token, 'tools/list');
  check(
    listing.body?.result?.tools?.some(
      (tool) => tool.name === 'read_fixture_page',
    ),
    'Tool discovery failed',
  );
  stage = 'fixture reads';
  for (const siteKey of SITE_KEYS) {
    const read = await rpc(grant.access_token, 'tools/call', {
      name: 'read_fixture_page',
      arguments: { siteKey },
    });
    check(
      read.response.ok && !read.body?.result?.isError,
      'Authorized fixture read failed',
    );
    const content = JSON.parse(read.body.result.content[0].text);
    check(
      content.markdown.includes('Hyvää päivää. Välkommen.') &&
        content.url === `${ORIGIN}/sites/${siteKey}/proof`,
      'Fixture text or citation mismatch',
    );
    check(
      Object.keys(content).sort().join(',') === 'markdown,title,url',
      'Fixture result exposed extra fields',
    );
  }
  const forged = await rpc(`${grant.access_token}forged`, 'tools/list');
  check(forged.response.status === 401, 'Forged bearer token accepted');
  const refresh = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    resource: `${ORIGIN}/mcp`,
    refresh_token: grant.refresh_token,
  });
  stage = 'refresh';
  const renewedResponse = await token(refresh);
  check(renewedResponse.ok, 'Real refresh failed');
  const renewed = await renewedResponse.json();
  const replay = await token(refresh);
  check(
    replay.status === 400 && (await replay.json()).error === 'invalid_grant',
    'Consumed refresh token replay or error protocol failed',
  );
  await disconnect();
  check(
    (await rpc(renewed.access_token, 'tools/list')).response.status === 401,
    'Disconnect retained bearer access',
  );
  refresh.set('refresh_token', renewed.refresh_token);
  const revoked = await token(refresh);
  check(
    revoked.status === 400 && (await revoked.json()).error === 'invalid_grant',
    'Disconnect retained renewal or returned a nonstandard error',
  );
  const reconnected = await authorize();
  check(
    (await rpc(reconnected.access_token, 'tools/list')).response.ok,
    'Reconnection failed',
  );
  await disconnect();
  cleaned = true;
  check(
    JSON.stringify(await documents()) === JSON.stringify(before),
    'Fixture content changed during reads',
  );
  console.log(
    JSON.stringify({
      project: 'skaldbase-test',
      realFirebaseSignIn: true,
      chromiumConsent: true,
      registeredClaudeConsentVerified: true,
      originlessCodeExchange: true,
      authenticatedDiscovery: true,
      sitesReadWithoutNewConsent: SITE_KEYS.length,
      forgedTokenRejected: true,
      refreshAndReplayCheck: true,
      disconnectStopsReadAndRenewal: true,
      reconnectAfterDisconnect: true,
      fixtureDataUnchanged: true,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      stage,
      error:
        error instanceof ProofFailure
          ? error.message
          : 'Runtime details suppressed',
      type: error?.constructor?.name,
      navigation: navigation.slice(-8),
      timeout: String(error?.message).includes('Timeout'),
      location: String(error?.stack).match(
        /verify-deployed-spike\.mjs:\d+:\d+/g,
      )?.[0],
    }),
  );
  process.exitCode = 1;
} finally {
  if (cookie && !cleaned) {
    try {
      await disconnect();
    } catch {
      console.error('Grant cleanup incomplete');
      process.exitCode = 1;
    }
  }
  const results = await Promise.allSettled([
    cookie
      ? fetch(`${ORIGIN}/api/auth/session`, {
          method: 'DELETE',
          headers: {
            Cookie: cookie,
            Origin: ORIGIN,
            'Content-Type': 'application/json',
          },
        }).then((response) => check(response.ok, 'Session cleanup failed'))
      : Promise.resolve(),
    browser?.close(),
    deleteApp(app),
  ]);
  if (results.some((result) => result.status === 'rejected')) {
    console.error('Verification resource cleanup incomplete');
    process.exitCode = 1;
  }
}
