import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { JwtService } from '@jmondi/oauth2-server';
import { createProofServer, RESOURCE, Store } from './proof.mjs';

const verifier = 'a'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');
const redirect = 'https://client.example/callback';
function authRequest(changes = {}, extras = '') {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'public-proof',
    redirect_uri: redirect,
    scope: 'mcp:read',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: RESOURCE,
    ...changes,
  });
  return new Request(`https://proof.example/authorize?${params}${extras}`);
}
function tokenRequest(grant, credential, changes = {}, extras = '') {
  const params = new URLSearchParams({
    grant_type: grant,
    client_id: 'public-proof',
    resource: RESOURCE,
    ...(grant === 'authorization_code'
      ? { code: credential, redirect_uri: redirect, code_verifier: verifier }
      : { refresh_token: credential }),
    ...changes,
  });
  return new Request('https://proof.example/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `${params}${extras}`,
  });
}
async function code(server, request = authRequest()) {
  const response = await server.authorize(request);
  return new URL(response.headers.get('location')).searchParams.get('code');
}
async function issue(store, uid = 'verified-test-user') {
  const server = createProofServer(store, uid);
  const id = await code(server);
  const response = await server.token(tokenRequest('authorization_code', id));
  assert.equal(response.status, 200);
  return { id, body: await response.json() };
}
function barrierFor(n) {
  let arrived = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    if (++arrived === n) release();
    await gate;
  };
}
function bearer(token) {
  return new Request(RESOURCE, {
    headers: { authorization: `Bearer ${token}` },
  });
}
const signing = new JwtService('proof-signing-secret-at-least-32-characters');

test('authorization requires one exact resource and redirect, including loopback port', async () => {
  const store = new Store();
  const server = createProofServer(store);
  for (const changes of [
    { resource: 'https://other.example/mcp' },
    { resource: '' },
    { resource: `${RESOURCE}#fragment` },
    { redirect_uri: 'https://client.example:443/callback' },
    { redirect_uri: '' },
    { redirect_uri: `${redirect}#fragment` },
    {
      client_id: 'loopback-proof',
      redirect_uri: 'http://127.0.0.1:3001/callback',
    },
    { scope: 'mcp:write' },
    { scope: '' },
  ])
    await assert.rejects(server.authorize(authRequest(changes)));
  for (const extra of [
    `&resource=${encodeURIComponent(RESOURCE)}`,
    `&redirect_uri=${encodeURIComponent(redirect)}`,
    '&aud=evil',
    '&audience=evil',
  ])
    await assert.rejects(server.authorize(authRequest({}, extra)));
  const loopback = await code(
    server,
    authRequest({
      client_id: 'loopback-proof',
      redirect_uri: 'http://127.0.0.1:3000/callback',
    }),
  );
  assert.equal(store.codes.get(loopback).resource, RESOURCE);
});

test('code exchange binds valid client, redirect, PKCE, scope and resource', async () => {
  const store = new Store();
  const server = createProofServer(store);
  const id = await code(server);
  const before = store.snapshot();
  for (const changes of [
    { client_id: 'loopback-proof' },
    { redirect_uri: 'https://client.example:443/callback' },
    { code_verifier: 'b'.repeat(43) },
    { resource: 'https://other.example/mcp' },
    { scope: 'mcp:write' },
    { aud: 'evil' },
    { audience: 'evil' },
  ])
    await assert.rejects(
      server.token(tokenRequest('authorization_code', id, changes)),
    );
  for (const extra of [
    `&resource=${encodeURIComponent(RESOURCE)}`,
    '&aud=evil',
    '&audience=evil',
    `&redirect_uri=${encodeURIComponent(redirect)}`,
  ])
    await assert.rejects(
      server.token(tokenRequest('authorization_code', id, {}, extra)),
    );
  await assert.rejects(
    server.token(
      new Request(
        'https://proof.example/token?audience=evil',
        tokenRequest('authorization_code', id),
      ),
    ),
  );
  assert.deepEqual(store.snapshot(), before);
  const response = await server.token(tokenRequest('authorization_code', id));
  const body = await response.json();
  const payload = await signing.verify(body.access_token, {
    issuer: 'https://proof.example',
    audience: RESOURCE,
  });
  assert.equal(payload.aud, RESOURCE);
  assert.equal(payload.sub, 'verified-test-user');
  assert.equal(store.tokens.get(payload.jti).resource, RESOURCE);
  await assert.rejects(server.token(tokenRequest('authorization_code', id)));
});

test('refresh preserves authorized UID and rejects escalation, tampering and replay', async () => {
  const store = new Store();
  const { body } = await issue(store, 'user-a');
  const server = createProofServer(store, 'user-b');
  const before = store.snapshot();
  for (const changes of [
    { client_id: 'loopback-proof' },
    { scope: 'mcp:write' },
    { resource: 'https://other.example/mcp' },
    { aud: 'evil' },
    { audience: 'evil' },
  ])
    await assert.rejects(
      server.token(tokenRequest('refresh_token', body.refresh_token, changes)),
    );
  for (const extra of [
    `&resource=${encodeURIComponent(RESOURCE)}`,
    '&aud=evil',
    '&audience=evil',
  ])
    await assert.rejects(
      server.token(
        tokenRequest('refresh_token', body.refresh_token, {}, extra),
      ),
    );
  assert.deepEqual(store.snapshot(), before);
  const rotated = await (
    await server.token(tokenRequest('refresh_token', body.refresh_token))
  ).json();
  const payload = await signing.verify(rotated.access_token, {
    issuer: 'https://proof.example',
    audience: RESOURCE,
  });
  assert.equal(payload.sub, 'user-a');
  assert.equal(store.tokens.get(payload.jti).user.id, 'user-a');
  await assert.rejects(
    server.token(tokenRequest('refresh_token', body.refresh_token)),
  );
});

test('precommit failure leaves full state unchanged and fresh request can retry', async () => {
  const store = new Store();
  const server = createProofServer(store);
  const id = await code(server);
  const before = store.snapshot();
  store.failCommit = true;
  await assert.rejects(server.token(tokenRequest('authorization_code', id)));
  assert.deepEqual(store.snapshot(), before);
  store.failCommit = false;
  await server.token(tokenRequest('authorization_code', id));
  const refresh = [...store.refresh.keys()][0];
  const afterCode = store.snapshot();
  store.failCommit = true;
  await assert.rejects(server.token(tokenRequest('refresh_token', refresh)));
  assert.deepEqual(store.snapshot(), afterCode);
  store.failCommit = false;
  await server.token(tokenRequest('refresh_token', refresh));
});

test('two servers race on one code; only the successful commit returns', async () => {
  const store = new Store();
  const id = await code(createProofServer(store));
  store.barrier = barrierFor(2);
  const outcome = await Promise.allSettled([
    createProofServer(store).token(tokenRequest('authorization_code', id)),
    createProofServer(store).token(tokenRequest('authorization_code', id)),
  ]);
  assert.equal(outcome.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(outcome.filter((x) => x.status === 'rejected').length, 1);
  assert.equal(store.tokens.size, 1);
});

test('two servers race on one refresh; replacement keeps original UID', async () => {
  const store = new Store();
  const { body } = await issue(store, 'user-a');
  store.barrier = barrierFor(2);
  const outcome = await Promise.allSettled([
    createProofServer(store, 'user-a').token(
      tokenRequest('refresh_token', body.refresh_token),
    ),
    createProofServer(store, 'user-b').token(
      tokenRequest('refresh_token', body.refresh_token),
    ),
  ]);
  assert.equal(outcome.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(outcome.filter((x) => x.status === 'rejected').length, 1);
  assert.equal([...store.tokens.values()].filter((t) => !t.revoked).length, 1);
  assert.equal(
    [...store.tokens.values()].find((t) => !t.revoked).user.id,
    'user-a',
  );
});

test('SDK gate accepts issued token and refuses forged, expired, wrong audience and scope', async () => {
  const store = new Store();
  const { body } = await issue(store);
  const server = createProofServer(store);
  assert.equal((await server.dispatch(bearer(body.access_token))).status, 200);
  const payload = await signing.verify(body.access_token);
  const parts = body.access_token.split('.');
  parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
  const variants = [
    parts.join('.'),
    await signing.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 10 }),
    await signing.sign({ ...payload, aud: 'https://other.example/mcp' }),
    await signing.sign({ ...payload, scope: 'mcp:write' }),
  ];
  for (const token of variants)
    assert.notEqual((await server.dispatch(bearer(token))).status, 200);
  assert.equal((await server.dispatch(bearer(variants[0]))).status, 401);
  assert.equal((await server.dispatch(bearer(variants[1]))).status, 401);
  assert.equal((await server.dispatch(bearer(variants[2]))).status, 401);
  assert.equal((await server.dispatch(bearer(variants[3]))).status, 401);
});

test('barrier failure preserves full state and retry succeeds', async () => {
  const store = new Store();
  const id = await code(createProofServer(store));
  const before = store.snapshot();
  store.barrier = async () => {
    throw new Error('injected barrier failure');
  };
  await assert.rejects(
    createProofServer(store).token(tokenRequest('authorization_code', id)),
  );
  assert.deepEqual(store.snapshot(), before);
  store.barrier = undefined;
  await createProofServer(store).token(tokenRequest('authorization_code', id));
});

test('failure after staging replacements leaves code and refresh state unchanged', async () => {
  const store = new Store();
  const server = createProofServer(store);
  const id = await code(server);
  const before = store.snapshot();
  store.failStagedCommit = true;
  await assert.rejects(
    server.token(tokenRequest('authorization_code', id)),
    /staged commit failure/,
  );
  assert.deepEqual(store.snapshot(), before);
  store.failStagedCommit = false;
  const body = await (
    await server.token(tokenRequest('authorization_code', id))
  ).json();
  const afterCode = store.snapshot();
  store.failStagedCommit = true;
  await assert.rejects(
    server.token(tokenRequest('refresh_token', body.refresh_token)),
    /staged commit failure/,
  );
  assert.deepEqual(store.snapshot(), afterCode);
  store.failStagedCommit = false;
  await server.token(tokenRequest('refresh_token', body.refresh_token));
});

test('required authorization parameters and S256 PKCE cannot be omitted', async () => {
  const store = new Store();
  const server = createProofServer(store);
  for (const key of ['resource', 'redirect_uri', 'code_challenge']) {
    const url = new URL(authRequest().url);
    url.searchParams.delete(key);
    await assert.rejects(server.authorize(new Request(url)));
  }
  await assert.rejects(
    server.authorize(
      authRequest({ code_challenge_method: 'plain', code_challenge: verifier }),
    ),
  );
  assert.equal(store.codes.size, 0);
  const id = await code(server);
  const before = store.snapshot();
  for (const key of ['resource', 'redirect_uri', 'code_verifier']) {
    const original = tokenRequest('authorization_code', id);
    const params = new URLSearchParams(await original.text());
    params.delete(key);
    await assert.rejects(
      server.token(
        new Request(original.url, {
          method: 'POST',
          headers: original.headers,
          body: params,
        }),
      ),
    );
  }
  assert.deepEqual(store.snapshot(), before);
  const body = await (
    await server.token(tokenRequest('authorization_code', id))
  ).json();
  const refresh = tokenRequest('refresh_token', body.refresh_token);
  const params = new URLSearchParams(await refresh.text());
  params.delete('resource');
  const afterCode = store.snapshot();
  await assert.rejects(
    server.token(
      new Request(refresh.url, {
        method: 'POST',
        headers: refresh.headers,
        body: params,
      }),
    ),
  );
  assert.deepEqual(store.snapshot(), afterCode);
});

test('SDK gate rejects anonymous callers, revoked tokens and verified insufficient scopes', async () => {
  const store = new Store();
  const { body } = await issue(store);
  const server = createProofServer(store);
  assert.equal((await server.dispatch(new Request(RESOURCE))).status, 401);
  const payload = await signing.verify(body.access_token);
  const record = store.tokens.get(payload.jti);
  record.revoked = true;
  assert.equal((await server.dispatch(bearer(body.access_token))).status, 401);
  record.revoked = false;
  record.scopes = [{ name: 'mcp:write' }];
  const limited = await signing.sign({ ...payload, scope: 'mcp:write' });
  assert.equal((await server.dispatch(bearer(limited))).status, 403);
});

test('independent authorizations preserve distinct verified users', async () => {
  const store = new Store();
  const [a, b] = await Promise.all([
    code(createProofServer(store, 'user-a')),
    code(createProofServer(store, 'user-b')),
  ]);
  const [one, two] = await Promise.all([
    createProofServer(store, 'user-b').token(
      tokenRequest('authorization_code', a),
    ),
    createProofServer(store, 'user-a').token(
      tokenRequest('authorization_code', b),
    ),
  ]);
  const first = await signing.verify((await one.json()).access_token);
  const second = await signing.verify((await two.json()).access_token);
  assert.equal(first.sub, 'user-a');
  assert.equal(second.sub, 'user-b');
});
