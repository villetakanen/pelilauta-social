import { randomUUID } from 'node:crypto';
import { AuthorizationServer, JwtService } from '@jmondi/oauth2-server';
import {
  requestFromVanilla,
  responseToVanilla,
} from '@jmondi/oauth2-server/vanilla';
import {
  OAuthError,
  OAuthErrorCode,
  requireBearerAuth,
} from '@modelcontextprotocol/server';

export const RESOURCE = 'https://proof.example/mcp';
export const SCOPE = { name: 'mcp:read' };
const ISSUER = 'https://proof.example';
const clients = [
  {
    id: 'public-proof',
    name: 'Proof client',
    redirectUris: ['https://client.example/callback'],
    allowedGrants: ['authorization_code', 'refresh_token'],
    scopes: [SCOPE],
  },
  {
    id: 'loopback-proof',
    name: 'Loopback client',
    redirectUris: ['http://127.0.0.1:3000/callback'],
    allowedGrants: ['authorization_code', 'refresh_token'],
    scopes: [SCOPE],
  },
];
const clone = (value) => structuredClone(value);

export class Store {
  codes = new Map();
  tokens = new Map();
  refresh = new Map();
  barrier;
  failCommit = false;
  failStagedCommit = false;
  snapshot() {
    return clone({
      codes: this.codes,
      tokens: this.tokens,
      refresh: this.refresh,
    });
  }
  async commit(work) {
    await this.barrier?.();
    if (this.failCommit) throw new Error('injected commit failure');
    const next = stageNextState(this, work);
    if (this.failStagedCommit)
      throw new Error('injected staged commit failure');
    this.codes = next.codes;
    this.tokens = next.tokens;
    this.refresh = next.refresh;
  }
}

export function stageNextState(store, work) {
  for (const [id, expected] of work.consumeCodes) {
    const current = store.codes.get(id);
    if (
      !current ||
      current.revoked ||
      current.resource !== expected.resource ||
      current.client.id !== expected.clientId
    )
      throw new Error('code conflict');
  }
  for (const [id, expected] of work.consumeRefresh) {
    const accessId = store.refresh.get(id);
    const current = store.tokens.get(accessId);
    if (
      !current ||
      current.revoked ||
      current.resource !== expected.resource ||
      current.client.id !== expected.clientId
    )
      throw new Error('refresh conflict');
  }
  const next = store.snapshot();
  for (const id of work.consumeCodes.keys()) next.codes.get(id).revoked = true;
  for (const id of work.consumeRefresh.keys())
    next.tokens.get(next.refresh.get(id)).revoked = true;
  for (const [id, code] of work.writeCodes) next.codes.set(id, clone(code));
  for (const [id, token] of work.writeTokens) {
    next.tokens.set(id, clone(token));
    if (token.refreshToken) next.refresh.set(token.refreshToken, id);
  }
  next.codes = new Map(
    [...next.codes].map(([id, record]) => [id, cleanUndefined(record)]),
  );
  next.tokens = new Map(
    [...next.tokens].map(([id, record]) => [id, cleanUndefined(record)]),
  );
  return next;
}

function cleanUndefined(value) {
  if (value instanceof Date) return new Date(value);
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cleanUndefined);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cleanUndefined(item)]),
  );
}

function one(params, key, required = false) {
  const values = params.getAll(key);
  if (values.length > 1 || (required && values.length !== 1))
    throw new Error(`invalid ${key}`);
  return values[0];
}
function exactResource(params) {
  if (
    params.has('aud') ||
    params.has('audience') ||
    one(params, 'resource', true) !== RESOURCE
  )
    throw new Error('invalid resource');
}
function exactRedirect(params, client) {
  const redirect = one(params, 'redirect_uri', true);
  if (
    !client ||
    !client.redirectUris.includes(redirect) ||
    redirect.includes('#')
  )
    throw new Error('invalid redirect_uri');
}
function scopeInput(params) {
  const scope = one(params, 'scope');
  if (scope !== undefined && scope !== SCOPE.name)
    throw new Error('invalid scope');
}

export function createProofServer(store, uid = 'verified-test-user') {
  function operation() {
    const work = {
      consumeCodes: new Map(),
      consumeRefresh: new Map(),
      writeCodes: new Map(),
      writeTokens: new Map(),
    };
    let credential;
    const codeRecord = (id) => work.writeCodes.get(id) ?? store.codes.get(id);
    const tokenRecord = (id) => {
      const accessId = store.refresh.get(id);
      return (
        [...work.writeTokens.values()].find((t) => t.refreshToken === id) ??
        store.tokens.get(accessId)
      );
    };
    const jwt = new JwtService('proof-signing-secret-at-least-32-characters');
    jwt.extraTokenFields = async ({ originatingAuthCodeId }) => {
      const grant = codeRecord(originatingAuthCodeId);
      if (!grant || grant.resource !== RESOURCE)
        throw new Error('unbound grant');
      return { aud: grant.resource };
    };
    const codeRepo = {
      issueAuthCode: async (client, user, scopes) => ({
        code: randomUUID(),
        expiresAt: new Date(),
        client,
        user,
        scopes,
      }),
      persist: async (code) =>
        work.writeCodes.set(
          code.code,
          clone({ ...code, resource: RESOURCE, revoked: false }),
        ),
      getByIdentifier: async (id) =>
        codeRecord(id) ? clone(codeRecord(id)) : undefined,
      isRevoked: async (id) =>
        work.consumeCodes.has(id) || codeRecord(id)?.revoked !== false,
      revoke: async (id) =>
        work.consumeCodes.set(id, {
          resource: RESOURCE,
          clientId: credential.client.id,
        }),
    };
    const tokenRepo = {
      issueToken: async (client, scopes, user) => ({
        accessToken: randomUUID(),
        client,
        scopes,
        user,
        resource: RESOURCE,
      }),
      persist: async (token) =>
        work.writeTokens.set(
          token.accessToken,
          clone({ ...token, revoked: false }),
        ),
      issueRefreshToken: async (token) => {
        token.refreshToken = randomUUID();
        work.writeTokens.set(
          token.accessToken,
          clone({ ...token, revoked: false }),
        );
        return token;
      },
      getByRefreshToken: async (id) =>
        tokenRecord(id) ? clone(tokenRecord(id)) : undefined,
      isRefreshTokenRevoked: async (token) =>
        !token ||
        work.consumeRefresh.has(token.refreshToken) ||
        token.revoked !== false,
      revoke: async (token) =>
        work.consumeRefresh.set(token.refreshToken, {
          resource: RESOURCE,
          clientId: credential.client.id,
        }),
    };
    const server = new AuthorizationServer(
      {
        getByIdentifier: async (id) => clients.find((c) => c.id === id),
        isClientValid: async () => true,
      },
      tokenRepo,
      {
        getAllByIdentifiers: async (names) =>
          names.includes(SCOPE.name) ? [SCOPE] : [],
        finalize: async (scopes) => scopes,
      },
      jwt,
      {
        requiresPKCE: true,
        requiresS256: true,
        useOpaqueAuthorizationCodes: true,
        useOpaqueRefreshTokens: true,
        issuer: ISSUER,
      },
    );
    server.enableGrantType({
      grant: 'authorization_code',
      authCodeRepository: codeRepo,
      userRepository: {
        getUserByCredentials: async (id) =>
          ['user-a', 'user-b', 'verified-test-user'].includes(id)
            ? { id }
            : undefined,
      },
    });
    return {
      server,
      work,
      setCredential: (value) => {
        credential = value;
      },
    };
  }
  return {
    async authorize(request) {
      const params = new URL(request.url).searchParams;
      exactResource(params);
      const client = clients.find(
        (c) => c.id === one(params, 'client_id', true),
      );
      exactRedirect(params, client);
      if (one(params, 'scope', true) !== SCOPE.name)
        throw new Error('invalid scope');
      const op = operation();
      const auth = await op.server.validateAuthorizationRequest(
        await requestFromVanilla(request),
      );
      auth.user = { id: uid };
      auth.isAuthorizationApproved = true;
      const response = responseToVanilla(
        await op.server.completeAuthorizationRequest(auth),
      );
      await store.commit(op.work);
      return response;
    },
    async token(request) {
      const query = new URL(request.url).searchParams;
      if (
        [...query.keys()].some((key) =>
          ['resource', 'aud', 'audience', 'scope', 'redirect_uri'].includes(
            key,
          ),
        )
      )
        throw new Error('invalid token query');
      const params = new URLSearchParams(await request.clone().text());
      exactResource(params);
      scopeInput(params);
      const grant = one(params, 'grant_type', true);
      const raw =
        grant === 'authorization_code'
          ? one(params, 'code', true)
          : grant === 'refresh_token'
            ? one(params, 'refresh_token', true)
            : undefined;
      const record =
        grant === 'authorization_code'
          ? store.codes.get(raw)
          : store.tokens.get(store.refresh.get(raw));
      const clientId = one(params, 'client_id', true);
      if (
        !record ||
        record.resource !== RESOURCE ||
        record.client.id !== clientId
      )
        throw new Error('credential mismatch');
      if (grant === 'authorization_code') {
        const client = clients.find((c) => c.id === clientId);
        exactRedirect(params, client);
      }
      const op = operation();
      op.setCredential({ client: record.client });
      const response = responseToVanilla(
        await op.server.respondToAccessTokenRequest(
          await requestFromVanilla(request),
        ),
      );
      await store.commit(op.work);
      return response;
    },
    async dispatch(request) {
      const jwt = new JwtService('proof-signing-secret-at-least-32-characters');
      const gate = requireBearerAuth({
        verifier: {
          verifyAccessToken: async (token) => {
            let payload;
            try {
              payload = await jwt.verify(token, {
                issuer: ISSUER,
                audience: RESOURCE,
              });
            } catch {
              throw new OAuthError(
                OAuthErrorCode.InvalidToken,
                'Invalid token',
              );
            }
            if (
              typeof payload.jti !== 'string' ||
              typeof payload.cid !== 'string' ||
              typeof payload.sub !== 'string' ||
              typeof payload.exp !== 'number' ||
              typeof payload.scope !== 'string' ||
              payload.aud !== RESOURCE
            )
              throw new OAuthError(
                OAuthErrorCode.InvalidToken,
                'Invalid claims',
              );
            const record = store.tokens.get(payload.jti);
            if (
              !record ||
              record.revoked ||
              record.resource !== payload.aud ||
              record.client.id !== payload.cid ||
              record.user?.id !== payload.sub ||
              record.scopes.map((scope) => scope.name).join(' ') !==
                payload.scope ||
              record.accessTokenExpiresAt.getTime() / 1000 < Date.now() / 1000
            )
              throw new OAuthError(
                OAuthErrorCode.InvalidToken,
                'Inactive token',
              );
            return {
              token,
              clientId: payload.cid,
              scopes: payload.scope.split(' '),
              expiresAt: payload.exp,
              resource: new URL(payload.aud),
            };
          },
        },
        expectedResource: new URL(RESOURCE),
        requiredScopes: [SCOPE.name],
        resourceMetadataUrl: `${ISSUER}/.well-known/oauth-protected-resource`,
      });
      const result = await gate(request);
      return result instanceof Response
        ? result
        : new Response('tool-dispatched');
    },
  };
}
