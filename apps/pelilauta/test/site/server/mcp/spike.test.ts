import { createHash } from 'node:crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { describe, expect, it, vi } from 'vitest';
import { spikeConfig } from '../../../../src/site/server/mcp/config';
import {
  CLAUDE_CODE_CALLBACK,
  CLAUDE_CODE_CALLBACK_PORT,
  CLAUDE_CODE_CLIENT_ID,
} from '../../../../src/site/server/mcp/environment.mjs';
import {
  handleSpikeRequest,
  type SpikeDependencies,
} from '../../../../src/site/server/mcp/handler';
import {
  consentProof,
  limitedBody,
  verifyConsent,
} from '../../../../src/site/server/mcp/http';
import { Store } from '../../../../src/site/server/mcp/oauth.mjs';

const issuer = 'https://proof-214.netlify.app';
const redirect = 'https://client.example/callback';
const env = {
  SECRET_MCP_SPIKE_ENABLED: 'true',
  PUBLIC_projectId: 'skaldbase-test',
  SECRET_MCP_SPIKE_ORIGIN: issuer,
  SECRET_MCP_SPIKE_NAMESPACE: '0d2df263-659b-4d53-988a-0c9218a4055b',
  SECRET_MCP_SPIKE_SIGNING_SECRET: 'test-signing-secret-not-for-cloud-'.repeat(
    2,
  ),
  SECRET_MCP_SPIKE_CLIENTS: JSON.stringify([
    { id: 'test-client', name: '<Test client>', redirectUris: [redirect] },
  ]),
  SECRET_MCP_SPIKE_USERS: JSON.stringify(['user-a', 'user-b']),
};
const config = (() => {
  const value = spikeConfig(env);
  if (!value) throw new Error('Invalid test configuration');
  return value;
})();
const verifier = 'a'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');
const params = new URLSearchParams({
  response_type: 'code',
  client_id: 'test-client',
  redirect_uri: redirect,
  resource: `${issuer}/mcp`,
  scope: 'mcp:read',
  code_challenge: challenge,
  code_challenge_method: 'S256',
  state: 'state-for-client',
});
const token: DecodedIdToken = {
  aud: 'skaldbase-test',
  auth_time: Math.floor(Date.now() / 1000),
  exp: 9999999999,
  iat: Math.floor(Date.now() / 1000),
  iss: 'https://session.firebase.google.com/skaldbase-test',
  sub: 'user-a',
  uid: 'user-a',
  firebase: { identities: {}, sign_in_provider: 'password' },
};

function setup() {
  const store = new Store();
  let disconnected = false;
  const deps: SpikeDependencies = {
    session: vi.fn(async () => ({ status: 'verified' as const, token })),
    loadStore: vi.fn(async () => store),
    verifyUser: vi.fn(async (user) => !disconnected && user?.id === 'user-a'),
    disconnect: vi.fn(async () => {
      disconnected = true;
    }),
    readPage: vi.fn(async () => ({
      title: 'Ääkköset',
      markdown: 'Hyvää päivää. Välkommen.',
    })),
  };
  const call = (endpoint: string, init?: RequestInit, query = '') =>
    handleSpikeRequest(
      new Request(
        `${issuer}/mcp${endpoint ? `/${endpoint}` : ''}${query}`,
        init,
      ),
      endpoint,
      config,
      deps,
    );
  const post = (body: URLSearchParams): RequestInit => ({
    method: 'POST',
    headers: {
      origin: issuer,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  async function approve(endpoint = 'authorize') {
    const query = endpoint === 'authorize' ? `?${params}` : '';
    const page = await call(endpoint, undefined, query);
    const html = await page.text();
    const proof = /name="proof" value="([^"]+)"/.exec(html)?.[1] ?? '';
    return call(
      endpoint,
      post(new URLSearchParams({ proof, decision: 'approve' })),
      query,
    );
  }
  async function issue() {
    const response = await approve();
    const code =
      new URL(response.headers.get('location') ?? '').searchParams.get(
        'code',
      ) ?? '';
    const exchange = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'test-client',
      resource: config.resource,
      redirect_uri: redirect,
      code_verifier: verifier,
      code,
    });
    const result = await call('token', post(exchange));
    expect(result.status).toBe(200);
    return result.json() as Promise<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>;
  }
  return { deps, call, post, approve, issue };
}

async function rpc(
  call: ReturnType<typeof setup>['call'],
  access: string,
  method: string,
  parameters?: unknown,
) {
  return call('', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${access}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: parameters }),
  });
}

describe('MCP spike configuration', () => {
  it('fails closed without opt-in, test project, namespace, secret or allowed origin', () => {
    expect(spikeConfig({})).toBeNull();
    for (const change of [
      { SECRET_MCP_SPIKE_ENABLED: 'false' },
      { PUBLIC_projectId: 'production' },
      { SECRET_MCP_SPIKE_ORIGIN: 'https://pelilauta.social' },
      { SECRET_MCP_SPIKE_ORIGIN: 'https://proof-214.netlify.app.evil.example' },
      { SECRET_MCP_SPIKE_NAMESPACE: 'arbitrary' },
      { SECRET_MCP_SPIKE_SIGNING_SECRET: 'short' },
      { SECRET_MCP_SPIKE_USERS: '[]' },
      {
        SECRET_MCP_SPIKE_CLIENTS: JSON.stringify([
          {
            id: 'x',
            name: 'x',
            redirectUris: ['https://client.example/callback#fragment'],
          },
        ]),
      },
    ])
      expect(spikeConfig({ ...env, ...change })).toBeNull();
    expect(config.resource).toBe(`${issuer}/mcp`);
    expect(
      spikeConfig({ ...env, SECRET_MCP_SPIKE_ORIGIN: 'http://localhost:4321' }),
    ).toBeNull();
    expect(
      spikeConfig(
        { ...env, SECRET_MCP_SPIKE_ORIGIN: 'http://localhost:4321' },
        true,
      ),
    ).not.toBeNull();
  });
});

describe('Claude Code callback registration', () => {
  const nativeEnv = (uri: string, id: string = CLAUDE_CODE_CLIENT_ID) => ({
    ...env,
    SECRET_MCP_SPIKE_CLIENTS: JSON.stringify([
      { id, name: 'Claude Code', redirectUris: [uri] },
    ]),
  });

  it('allows only the fixed loopback callback for the native client', () => {
    expect(spikeConfig(nativeEnv(CLAUDE_CODE_CALLBACK))).not.toBeNull();
    expect(
      spikeConfig(nativeEnv(CLAUDE_CODE_CALLBACK, 'other-client')),
    ).toBeNull();
    for (const uri of [
      `http://localhost:${CLAUDE_CODE_CALLBACK_PORT + 1}/callback`,
      `http://127.0.0.1:${CLAUDE_CODE_CALLBACK_PORT}/callback`,
      `http://[::1]:${CLAUDE_CODE_CALLBACK_PORT}/callback`,
      `http://localhost.evil.example:${CLAUDE_CODE_CALLBACK_PORT}/callback`,
      `${CLAUDE_CODE_CALLBACK}/other`,
      `${CLAUDE_CODE_CALLBACK}?extra=1`,
      `${CLAUDE_CODE_CALLBACK}#fragment`,
    ])
      expect(spikeConfig(nativeEnv(uri))).toBeNull();
    expect(
      spikeConfig({
        ...nativeEnv(CLAUDE_CODE_CALLBACK),
        PUBLIC_projectId: 'production',
      }),
    ).toBeNull();
  });

  it('binds consent and exchange to the native client and exact callback', async () => {
    const nativeConfig = spikeConfig(nativeEnv(CLAUDE_CODE_CALLBACK));
    if (!nativeConfig) throw new Error('Invalid native test configuration');
    const { deps } = setup();
    const query = new URLSearchParams(params);
    query.set('client_id', CLAUDE_CODE_CLIENT_ID);
    query.set('redirect_uri', CLAUDE_CODE_CALLBACK);
    const url = `${issuer}/mcp/authorize?${query}`;
    const page = await handleSpikeRequest(
      new Request(url),
      'authorize',
      nativeConfig,
      deps,
    );
    const html = await page.text();
    expect(html).toContain(`localhost:${CLAUDE_CODE_CALLBACK_PORT}`);
    expect(html).toContain(
      'Continue only if you started this connection in Claude Code.',
    );
    expect(page.headers.get('content-security-policy')).toContain(
      `form-action 'self' http://localhost:${CLAUDE_CODE_CALLBACK_PORT};`,
    );
    const proof = /name="proof" value="([^"]+)"/.exec(html)?.[1] ?? '';
    const approved = await handleSpikeRequest(
      new Request(url, {
        method: 'POST',
        headers: {
          Origin: issuer,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ proof, decision: 'approve' }),
      }),
      'authorize',
      nativeConfig,
      deps,
    );
    const location = new URL(approved.headers.get('location') ?? '');
    expect(location.origin + location.pathname).toBe(CLAUDE_CODE_CALLBACK);
    const exchange = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLAUDE_CODE_CLIENT_ID,
      resource: nativeConfig.resource,
      redirect_uri: CLAUDE_CODE_CALLBACK,
      code_verifier: verifier,
      code: location.searchParams.get('code') ?? '',
    });
    const send = () =>
      handleSpikeRequest(
        new Request(`${issuer}/mcp/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: exchange,
        }),
        'token',
        nativeConfig,
        deps,
      );
    exchange.set(
      'redirect_uri',
      `http://localhost:${CLAUDE_CODE_CALLBACK_PORT + 1}/callback`,
    );
    expect((await send()).status).toBe(400);
    exchange.set('redirect_uri', CLAUDE_CODE_CALLBACK);
    expect((await send()).status).toBe(200);
  });
});

describe('MCP consent and protocol', () => {
  it('rejects anonymous initialization, discovery and reads before loading records', async () => {
    const { call, deps } = setup();
    for (const method of ['initialize', 'tools/list', 'tools/call']) {
      const response = await rpc(call, '', method);
      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toContain(
        '/.well-known/oauth-protected-resource/mcp',
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect(deps.loadStore).not.toHaveBeenCalled();
    expect(deps.readPage).not.toHaveBeenCalled();
  });

  it('publishes discovery without reading authentication or storage', async () => {
    const { call, deps } = setup();
    expect(
      (await (await call('metadata')).json())
        .token_endpoint_auth_methods_supported,
    ).toEqual(['none']);
    expect((await (await call('resource-metadata')).json()).resource).toBe(
      config.resource,
    );
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.loadStore).not.toHaveBeenCalled();
  });

  it('escapes consent text and creates no grant until a same-origin approved POST', async () => {
    const { call, deps, approve } = setup();
    const page = await call('authorize', undefined, `?${params}`);
    const html = await page.text();
    expect(html).toContain('&lt;Test client&gt;');
    expect(html).not.toContain('<Test client>');
    expect(page.headers.get('referrer-policy')).toBe('same-origin');
    expect(page.headers.get('content-security-policy')).toContain(
      "form-action 'self' https://client.example;",
    );
    expect(deps.loadStore).not.toHaveBeenCalled();
    const response = await approve();
    expect(response.status).toBe(302);
    expect(
      new URL(response.headers.get('location') ?? '').searchParams.get('state'),
    ).toBe('state-for-client');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(deps.loadStore).toHaveBeenCalledOnce();
  });

  it('preserves the login return path without starting an authorization grant', async () => {
    const { call, deps } = setup();
    vi.mocked(deps.session).mockResolvedValue({ status: 'rejected' });
    const response = await call('authorize', undefined, `?${params}`);
    expect(response.status).toBe(303);
    expect(
      new URL(response.headers.get('location') ?? '', issuer).searchParams.get(
        'redirect',
      ),
    ).toBe(`/mcp/authorize?${params}`);
    expect(deps.loadStore).not.toHaveBeenCalled();
    vi.mocked(deps.session).mockResolvedValue({ status: 'unavailable' });
    expect((await call('authorize', undefined, `?${params}`)).status).toBe(503);
  });

  it('rejects changed, expired, other-user and cross-origin consent proofs', async () => {
    const { call, post, deps } = setup();
    const query = `authorize:?${params}`;
    for (const proof of [
      consentProof(config.signingSecret, 'user-b', query),
      consentProof(config.signingSecret, 'user-a', query, Date.now() - 300001),
      consentProof(config.signingSecret, 'user-a', `${query}&state=other`),
      'forged',
    ])
      expect(
        (
          await call(
            'authorize',
            post(new URLSearchParams({ proof, decision: 'approve' })),
            `?${params}`,
          )
        ).status,
      ).toBe(403);
    expect(
      (
        await call(
          'authorize',
          { headers: { origin: 'https://evil.example' } },
          `?${params}`,
        )
      ).status,
    ).toBe(403);
    expect(deps.loadStore).not.toHaveBeenCalled();
    expect(verifyConsent(config.signingSecret, 'user-a', query, '1.z')).toBe(
      false,
    );
  });

  it('rejects invalid resource, redirect, PKCE and duplicate parameters before identity lookup', async () => {
    const { call, deps } = setup();
    for (const [key, value] of [
      ['resource', 'https://other.example/mcp'],
      ['redirect_uri', 'https://client.example:443/callback'],
      ['code_challenge_method', 'plain'],
      ['scope', 'mcp:write'],
    ]) {
      const altered = new URLSearchParams(params);
      altered.set(key, value);
      expect((await call('authorize', undefined, `?${altered}`)).status).toBe(
        400,
      );
    }
    expect(
      (await call('authorize', undefined, `?${params}&client_id=test-client`))
        .status,
    ).toBe(400);
    expect(deps.session).not.toHaveBeenCalled();
  });

  it('exchanges the Firebase-bound grant and reads both fixture sites without renewed consent', async () => {
    const { issue, call, deps } = setup();
    const body = await issue();
    expect(body.expires_in).toBeLessThanOrEqual(300);
    const init = await rpc(call, body.access_token, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });
    expect(init.status).toBe(200);
    expect(await init.text()).toContain('pelilauta-214-spike');
    expect(
      await (await rpc(call, body.access_token, 'tools/list')).text(),
    ).toContain('read_fixture_page');
    for (const siteKey of ['mcp-proof-214-a', 'mcp-proof-214-b']) {
      const response = await rpc(call, body.access_token, 'tools/call', {
        name: 'read_fixture_page',
        arguments: { siteKey },
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('Välkommen');
      expect(deps.readPage).toHaveBeenCalledWith('user-a', siteKey);
    }
    expect(deps.session).toHaveBeenCalledTimes(2);
  });

  it('refreshes from delegated identity and disconnect stops reads and renewal', async () => {
    const { issue, call, post, approve, deps } = setup();
    const first = await issue();
    const refresh = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'test-client',
      resource: config.resource,
      refresh_token: first.refresh_token,
    });
    const renewed = await call('token', post(refresh));
    expect(renewed.status).toBe(200);
    const next = await renewed.json();
    const replayed = await call('token', post(refresh));
    expect(replayed.status).toBe(400);
    expect(await replayed.json()).toEqual({ error: 'invalid_grant' });
    expect((await approve('disconnect')).status).toBe(200);
    expect((await rpc(call, next.access_token, 'tools/list')).status).toBe(401);
    refresh.set('refresh_token', next.refresh_token);
    const revoked = await call('token', post(refresh));
    expect(revoked.status).toBe(400);
    expect(await revoked.json()).toEqual({ error: 'invalid_grant' });
    expect(deps.readPage).not.toHaveBeenCalled();
  });

  it('rejects forged credentials and invalid fixture arguments without reading content', async () => {
    const { issue, call, deps } = setup();
    const body = await issue();
    expect(
      (await rpc(call, `${body.access_token}forged`, 'tools/list')).status,
    ).toBe(401);
    for (const args of [
      { siteKey: 'other-site' },
      { siteKey: 'mcp-proof-214-a', uid: 'user-b' },
    ]) {
      const response = await rpc(call, body.access_token, 'tools/call', {
        name: 'read_fixture_page',
        arguments: args,
      });
      expect(await response.text()).not.toContain('Välkommen');
    }
    expect(deps.readPage).not.toHaveBeenCalled();
  });

  it('reports backend failures without disclosing backend error text', async () => {
    const { issue, call, post, deps } = setup();
    const body = await issue();
    vi.mocked(deps.readPage).mockRejectedValue(
      new Error('private backend details'),
    );
    const response = await rpc(call, body.access_token, 'tools/call', {
      name: 'read_fixture_page',
      arguments: { siteKey: 'mcp-proof-214-a' },
    });
    const text = await response.text();
    expect(text).toContain('temporarily unavailable');
    expect(text).not.toContain('private backend details');
    vi.mocked(deps.loadStore).mockRejectedValue(
      new Error('private backend details'),
    );
    const failed = await call(
      'token',
      post(new URLSearchParams({ grant_type: 'refresh_token' })),
    );
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain('private backend details');
    const large = await call(
      'token',
      post(new URLSearchParams({ oversized: 'x'.repeat(17000) })),
    );
    expect(large.status).toBe(413);
  });

  it('bounds request bodies even without a content-length header', async () => {
    await expect(
      limitedBody(
        new Request(issuer, { method: 'POST', body: 'x'.repeat(16385) }),
      ),
    ).rejects.toThrow('Body limit');
  });
});
