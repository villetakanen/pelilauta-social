import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import handler from '../../.netlify/v1/functions/ssr/ssr.mjs';
import {
  CLAUDE_CODE_CALLBACK,
  CLAUDE_CODE_CALLBACK_PORT,
  CLAUDE_CODE_CLIENT_ID,
} from '../../src/site/server/mcp/environment.mjs';

const enabled = process.argv.includes('--enabled');
const issuer = enabled
  ? 'https://proof-214.netlify.app'
  : 'http://localhost:4321';
const originalFetch = globalThis.fetch;
let restoreFirestore;
if (enabled) {
  const require = createRequire(
    new URL('../../.netlify/v1/functions/ssr/ssr.mjs', import.meta.url),
  );
  const { getApps, initializeApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const app = getApps()[0] ?? initializeApp({ projectId: 'skaldbase-test' });
  const db = getFirestore(app);
  assert.equal(db.projectId, 'skaldbase-test');
  const originalCollection = db.collection;
  const namespace = {
    id: '0d2df263-659b-4d53-988a-0c9218a4055b',
    parent: { path: 'mcpAuthorizationProof214' },
    firestore: db,
    get: async () => ({
      exists: true,
      data: () => ({ purpose: 'oauth-authorization-proof-214' }),
    }),
    collection: (kind) => {
      assert.ok(['codes', 'tokens'].includes(kind));
      return { limit: () => ({ get: async () => ({ size: 0, docs: [] }) }) };
    },
  };
  db.collection = (name) => {
    assert.equal(name, 'mcpAuthorizationProof214');
    return {
      doc: (id) => {
        assert.equal(id, namespace.id);
        return namespace;
      },
    };
  };
  restoreFirestore = () => {
    db.collection = originalCollection;
  };
}
globalThis.fetch = async () => {
  throw new Error('MCP adapter checks must not make network requests');
};
const render = (
  path,
  method = 'POST',
  origin,
  contentType = 'application/x-www-form-urlencoded',
) => {
  const headers = {
    'Content-Type': contentType,
    Cookie: 'session=malformed',
    Authorization: 'Bearer forged',
  };
  if (origin !== undefined) headers.Origin = origin;
  return handler(
    new Request(`${issuer}${path}`, {
      method,
      headers,
      ...(method === 'POST' ? { body: 'grant_type=authorization_code' } : {}),
    }),
    { ip: '127.0.0.1' },
  );
};
try {
  if (!enabled) {
    for (const path of [
      '/mcp',
      '/mcp/authorize',
      '/mcp/token',
      '/mcp/disconnect',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource/mcp',
    ]) {
      for (const method of ['GET', 'POST']) {
        const response = await render(path, method, issuer);
        assert.equal(response.status, 404, `${method} ${path}`);
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
    }
  } else {
    for (const grant of ['authorization_code', 'refresh_token']) {
      const response = await handler(
        new Request(`${issuer}/mcp/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: 'session=malformed',
          },
          body: new URLSearchParams({
            grant_type: grant,
            client_id: 'test-client',
            resource: `${issuer}/mcp`,
            ...(grant === 'authorization_code'
              ? {
                  code: 'forged',
                  redirect_uri: 'https://client.example/callback',
                  code_verifier: 'a'.repeat(43),
                }
              : { refresh_token: 'forged' }),
          }),
        }),
        { ip: '127.0.0.1' },
      );
      assert.equal(
        response.status,
        400,
        'Originless token requests reach OAuth validation',
      );
      assert.deepEqual(await response.json(), { error: 'invalid_grant' });
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('set-cookie'), null);
    }
    const metadata = await render(
      '/.well-known/oauth-authorization-server',
      'GET',
    );
    assert.equal(
      metadata.status,
      200,
      'The adapter fixture must enable the spike',
    );
    assert.equal((await metadata.json()).issuer, issuer);
    const native = new URLSearchParams({
      response_type: 'code',
      client_id: CLAUDE_CODE_CLIENT_ID,
      redirect_uri: CLAUDE_CODE_CALLBACK,
      resource: `${issuer}/mcp`,
      scope: 'mcp:read',
      code_challenge: 'a'.repeat(43),
      code_challenge_method: 'S256',
    });
    const consent = await render(`/mcp/authorize?${native}`, 'GET');
    assert.equal(
      consent.status,
      303,
      'Registered native callback reaches sign-in',
    );
    assert.ok(consent.headers.get('location')?.startsWith('/login?redirect='));
    native.set(
      'redirect_uri',
      `http://localhost:${CLAUDE_CODE_CALLBACK_PORT + 1}/callback`,
    );
    assert.equal(
      (await render(`/mcp/authorize?${native}`, 'GET')).status,
      400,
      'Other loopback ports remain rejected',
    );
  }
  for (const path of [
    '/mcp/authorize',
    '/mcp/disconnect',
    '/api/auth/session',
    '/mcp/token/',
    '/mcp/token/other',
  ]) {
    for (const origin of [undefined, 'null', 'https://evil.example']) {
      assert.equal(
        (await render(path, 'POST', origin)).status,
        403,
        `${path} ${origin}`,
      );
    }
  }
  for (const origin of ['null', 'https://evil.example']) {
    assert.equal((await render('/mcp/token', 'POST', origin)).status, 403);
  }
  if (!enabled)
    assert.equal(
      (await render('/mcp/token')).status,
      403,
      'Disabled builds retain Astro origin checks',
    );
  console.log(
    `MCP adapter origin checks passed (${enabled ? 'enabled test spike with mocked Firestore' : 'disabled spike'}).`,
  );
} finally {
  globalThis.fetch = originalFetch;
  restoreFirestore?.();
}
