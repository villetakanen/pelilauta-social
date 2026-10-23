import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import handler from '../../.netlify/v1/functions/ssr/ssr.mjs';

const functionEntry = new URL(
  '../../.netlify/v1/functions/ssr/ssr.mjs',
  import.meta.url,
);
const require = createRequire(functionEntry);
const { getAuth } = require('firebase-admin/auth');
const context = { ip: '127.0.0.1' };
const request = (path, options = {}) =>
  new Request(`http://localhost:4321${path}`, options);
const render = (path, options) => handler(request(path, options), context);
const configResponse = await render('/api/test/firebase-config');
const config = await configResponse.json();
assert.equal(
  config.projectId,
  'skaldbase-test',
  'Adapter checks require a test-project build',
);

await render('/api/auth/session', { headers: { Cookie: 'session=malformed' } });
const auth = getAuth();
const original = auth.verifySessionCookie;
const originalFetch = globalThis.fetch;
// Route same-origin SSR fetches through the generated function without a development server.
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  return url.origin === 'http://localhost:4321'
    ? handler(new Request(input, init), context)
    : originalFetch(input, init);
};
let calls = 0;
const result = { uid: 'adapter-reader', exp: 1900000000 };
let failure;
auth.verifySessionCookie = async () => {
  calls++;
  if (failure) throw failure;
  return result;
};

function expectPrivate(response, status) {
  assert.equal(response.status, status);
  for (const name of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Netlify-CDN-Cache-Control',
    'Vercel-CDN-Cache-Control',
  ]) {
    assert.equal(response.headers.get(name), 'no-store', name);
  }
}

try {
  for (const [code, status] of [
    ['auth/session-cookie-expired', 401],
    ['auth/session-cookie-revoked', 401],
    ['auth/user-disabled', 401],
    ['auth/user-not-found', 401],
    ['app/network-timeout', 503],
    ['auth/internal-error', 500],
  ]) {
    failure = { code };
    calls = 0;
    const response = await render('/settings?view=list&redirect=%2Finbox', {
      headers: { Cookie: 'session=adapter-cookie' },
    });
    expectPrivate(response, status);
    const body = await response.text();
    assert.equal(
      calls,
      1,
      'Recovery rendering must not verify credentials again',
    );
    assert.equal(response.headers.get('Location'), null);
    assert.ok(body.includes('RecoveryPanel'));
    assert.ok(!body.includes('SettingsApp'));
    assert.ok(body.includes('noindex, nofollow'));
    assert.ok(
      body.includes(
        '/login?redirect=%2Fsettings%3Fview%3Dlist%26redirect%3D%252Finbox',
      ),
    );
    assert.ok(!body.includes('Test user login form'));
    const head = await render('/settings', {
      method: 'HEAD',
      headers: { Cookie: 'session=adapter-cookie' },
    });
    expectPrivate(head, status);
    assert.equal(await head.text(), '');
    const api = await render('/api/auth/session', {
      headers: { Cookie: 'session=adapter-cookie' },
    });
    expectPrivate(api, status);
    assert.ok(!(await api.text()).includes('RecoveryPanel'));
    console.log(
      `Netlify adapter: ${code} -> ${status}; one verification, private recovery, empty HEAD, unchanged API`,
    );
  }

  failure = undefined;
  const verified = await render('/settings', {
    headers: { Cookie: 'session=adapter-cookie' },
  });
  expectPrivate(verified, 200);
  const verifiedBody = await verified.text();
  assert.ok(verifiedBody.includes('SettingsApp'));
  assert.ok(!verifiedBody.includes('RecoveryPanel'));
  assert.ok(verifiedBody.includes('sessionStorage.removeItem'));

  const denied = await render('/sites/e2e-recovery-nonowner-site/settings', {
    headers: { Cookie: 'session=adapter-cookie' },
  });
  expectPrivate(denied, 403);
  assert.equal(await denied.text(), 'Forbidden');

  calls = 0;
  failure = new Error('Public documents must not invoke authentication');
  const publicPage = await render('/');
  assert.equal(publicPage.status, 200);
  await publicPage.text();
  assert.equal(calls, 0);

  const signedOut = await render('/settings');
  expectPrivate(signedOut, 401);
  const blockedMutation = await render('/settings', {
    method: 'POST',
    body: 'submitted data',
  });
  assert.equal(blockedMutation.status, 403);
  assert.ok(!(await blockedMutation.text()).includes('RecoveryPanel'));
  const mutation = await render('/settings', {
    method: 'POST',
    body: 'submitted data',
    headers: { Origin: 'http://localhost:4321' },
  });
  expectPrivate(mutation, 302);
  assert.equal(mutation.headers.get('Location'), '/login?redirect=%2Fsettings');
  assert.ok(!(await mutation.text()).includes('RecoveryPanel'));

  const login = await render('/login?recovery=1&status=503', {
    headers: { 'X-Recovery-Status': '503' },
  });
  expectPrivate(login, 200);
  const loginBody = await login.text();
  assert.ok(!loginBody.includes('RecoveryPanel'));
  assert.ok(!loginBody.includes('Test user login form'));
  console.log(
    'Netlify adapter: verified documents, owner denial, public independence, mutation exclusion, and production login passed',
  );
} finally {
  auth.verifySessionCookie = original;
  globalThis.fetch = originalFetch;
}
