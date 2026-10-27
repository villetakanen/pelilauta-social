import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { JwtService } from '@jmondi/oauth2-server';
import { validateFirestoreEnvironment } from './firestore-guards.mjs';
import {
  cleanupRunNamespace,
  createRunNamespace,
  loadRunStore,
  MAX_RUN_RECORDS,
  recordRef,
} from './firestore-store.mjs';
import { createProofServer, RESOURCE } from './proof.mjs';

const serviceAccount = await validateFirestoreEnvironment();
const { cert, initializeApp, deleteApp } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const app = initializeApp(
  { credential: cert(serviceAccount), projectId: 'skaldbase-test' },
  `mcp-proof-${randomUUID()}`,
);
const db = getFirestore(app);
const namespace = randomUUID();
const runRef = db.collection('mcpAuthorizationProof214').doc(namespace);
const verifier = 'a'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');
const redirect = 'https://client.example/callback';
const signing = new JwtService('proof-signing-secret-at-least-32-characters');

function authRequest() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'public-proof',
    redirect_uri: redirect,
    scope: 'mcp:read',
    resource: RESOURCE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return new Request(`https://proof.example/authorize?${params}`);
}
function tokenRequest(grant, credential) {
  return new Request('https://proof.example/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: grant,
      [grant === 'authorization_code' ? 'code' : 'refresh_token']: credential,
      client_id: 'public-proof',
      redirect_uri: redirect,
      code_verifier: verifier,
      resource: RESOURCE,
    }),
  });
}
async function snapshot() {
  const [codes, tokens] = await Promise.all(
    ['codes', 'tokens'].map((kind) =>
      runRef
        .collection(kind)
        .limit(MAX_RUN_RECORDS + 1)
        .get(),
    ),
  );
  assert.ok(codes.size + tokens.size <= MAX_RUN_RECORDS);
  return {
    codes: codes.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    tokens: tokens.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
}
async function server(uid) {
  return createProofServer(await loadRunStore(db, runRef), uid);
}
async function issueCode(uid = 'verified-test-user') {
  const response = await (await server(uid)).authorize(authRequest());
  assert.equal(response.status, 302);
  return new URL(response.headers.get('location')).searchParams.get('code');
}
async function exchange(code) {
  const response = await (await server()).token(
    tokenRequest('authorization_code', code),
  );
  assert.equal(response.status, 200);
  return response.json();
}
async function issueTokens(uid) {
  return exchange(await issueCode(uid));
}
function barrierForTwo() {
  let arrivals = 0;
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    if (++arrivals === 2) release();
    await ready;
  };
}
async function verify(token, uid = 'verified-test-user') {
  const payload = await signing.verify(token, {
    issuer: 'https://proof.example',
    audience: RESOURCE,
  });
  assert.equal(payload.aud, RESOURCE);
  assert.equal(payload.sub, uid);
  return payload;
}

describe(
  'live test-project OAuth transaction proof',
  { concurrency: false, timeout: 120000 },
  () => {
    before(async () => {
      await createRunNamespace(db, namespace);
    });
    after(async () => {
      try {
        const removed = await cleanupRunNamespace(runRef);
        assert.equal((await runRef.get()).exists, false);
        for (const kind of ['codes', 'tokens'])
          assert.equal(
            (await runRef.collection(kind).limit(1).get()).empty,
            true,
          );
        console.log(
          `Cleaned isolated proof namespace: ${removed.codes} codes and ${removed.tokens} tokens.`,
        );
      } finally {
        await deleteApp(app);
      }
    });

    test('authorization, exchange, reload, bearer verification and refresh retain audience and UID', async () => {
      const body = await issueTokens('user-a');
      await verify(body.access_token, 'user-a');
      const response = await (await server('user-b')).token(
        tokenRequest('refresh_token', body.refresh_token),
      );
      assert.equal(response.status, 200);
      const rotated = await response.json();
      await verify(rotated.access_token, 'user-a');
      const request = new Request(RESOURCE, {
        headers: { authorization: `Bearer ${rotated.access_token}` },
      });
      assert.equal((await (await server()).dispatch(request)).status, 200);
    });

    test('independent stores race on one code and persist only one replacement', async () => {
      const code = await issueCode('user-a');
      const [a, b] = await Promise.all([
        loadRunStore(db, runRef),
        loadRunStore(db, runRef),
      ]);
      const beforeState = await snapshot();
      a.barrier = b.barrier = barrierForTwo();
      const outcomes = await Promise.allSettled(
        [a, b].map((store) =>
          createProofServer(store).token(
            tokenRequest('authorization_code', code),
          ),
        ),
      );
      const successful = outcomes.filter(
        (outcome) => outcome.status === 'fulfilled',
      );
      const failed = outcomes.filter(
        (outcome) => outcome.status === 'rejected',
      );
      assert.equal(successful.length, 1);
      assert.equal(failed.length, 1);
      assert.match(failed[0].reason.message, /code conflict/);
      const body = await successful[0].value.json();
      await verify(body.access_token, 'user-a');
      const current = await snapshot();
      assert.equal(current.tokens.length - beforeState.tokens.length, 1);
      assert.equal(current.codes.length, beforeState.codes.length);
      assert.equal(
        (await recordRef(runRef, 'codes', code).get()).data().revoked,
        true,
      );
    });

    test('independent stores race on one refresh and preserve the original UID', async () => {
      const body = await issueTokens('user-a');
      const [a, b] = await Promise.all([
        loadRunStore(db, runRef),
        loadRunStore(db, runRef),
      ]);
      const beforeState = await snapshot();
      a.barrier = b.barrier = barrierForTwo();
      const outcomes = await Promise.allSettled([
        createProofServer(a, 'user-a').token(
          tokenRequest('refresh_token', body.refresh_token),
        ),
        createProofServer(b, 'user-b').token(
          tokenRequest('refresh_token', body.refresh_token),
        ),
      ]);
      const successful = outcomes.filter(
        (outcome) => outcome.status === 'fulfilled',
      );
      const failed = outcomes.filter(
        (outcome) => outcome.status === 'rejected',
      );
      assert.equal(successful.length, 1);
      assert.equal(failed.length, 1);
      assert.match(failed[0].reason.message, /refresh conflict/);
      const rotated = await successful[0].value.json();
      const payload = await verify(rotated.access_token, 'user-a');
      const current = await snapshot();
      const newTokens = current.tokens.filter(
        (token) => !beforeState.tokens.some((old) => old.id === token.id),
      );
      assert.equal(newTokens.length, 1);
      assert.equal(newTokens[0].accessToken, payload.jti);
      assert.equal(newTokens[0].user.id, 'user-a');
      assert.equal(
        current.tokens.find(
          (token) => token.refreshToken === body.refresh_token,
        ).revoked,
        true,
      );
    });

    test('throwing after Firestore writes are scheduled aborts code and refresh changes atomically', async () => {
      const code = await issueCode();
      const store = await loadRunStore(db, runRef);
      const beforeCode = await snapshot();
      store.failStagedCommit = true;
      await assert.rejects(
        createProofServer(store).token(
          tokenRequest('authorization_code', code),
        ),
        /staged commit failure/,
      );
      assert.deepEqual(await snapshot(), beforeCode);
      const body = await exchange(code);
      const refreshStore = await loadRunStore(db, runRef);
      const beforeRefresh = await snapshot();
      refreshStore.failStagedCommit = true;
      await assert.rejects(
        createProofServer(refreshStore).token(
          tokenRequest('refresh_token', body.refresh_token),
        ),
        /staged commit failure/,
      );
      assert.deepEqual(await snapshot(), beforeRefresh);
      const response = await (await server()).token(
        tokenRequest('refresh_token', body.refresh_token),
      );
      assert.equal(response.status, 200);
      await verify((await response.json()).access_token);
    });

    test('transaction rereads reject stale consumed and revoked code and refresh snapshots', async () => {
      const code = await issueCode();
      const stale = await loadRunStore(db, runRef);
      await exchange(code);
      const afterExchange = await snapshot();
      await assert.rejects(
        createProofServer(stale).token(
          tokenRequest('authorization_code', code),
        ),
        /code conflict/,
      );
      assert.deepEqual(await snapshot(), afterExchange);

      const revokedCode = await issueCode();
      const staleCode = await loadRunStore(db, runRef);
      await recordRef(runRef, 'codes', revokedCode).update({ revoked: true });
      const afterRevocation = await snapshot();
      await assert.rejects(
        createProofServer(staleCode).token(
          tokenRequest('authorization_code', revokedCode),
        ),
        /code conflict/,
      );
      assert.deepEqual(await snapshot(), afterRevocation);

      const body = await issueTokens();
      const staleRefresh = await loadRunStore(db, runRef);
      await (await server()).token(
        tokenRequest('refresh_token', body.refresh_token),
      );
      const afterRefresh = await snapshot();
      await assert.rejects(
        createProofServer(staleRefresh).token(
          tokenRequest('refresh_token', body.refresh_token),
        ),
        /refresh conflict/,
      );
      assert.deepEqual(await snapshot(), afterRefresh);

      const revocable = await issueTokens();
      const staleToken = await loadRunStore(db, runRef);
      const accessId = staleToken.refresh.get(revocable.refresh_token);
      await recordRef(runRef, 'tokens', accessId).update({ revoked: true });
      const afterTokenRevocation = await snapshot();
      await assert.rejects(
        createProofServer(staleToken).token(
          tokenRequest('refresh_token', revocable.refresh_token),
        ),
        /refresh conflict/,
      );
      assert.deepEqual(await snapshot(), afterTokenRevocation);
    });
  },
);
