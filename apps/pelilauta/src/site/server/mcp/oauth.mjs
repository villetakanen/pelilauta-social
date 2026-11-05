import { randomUUID } from 'node:crypto';
import {
  AuthorizationServer,
  DateInterval,
  JwtService,
} from '@jmondi/oauth2-server';
import {
  requestFromVanilla,
  responseToVanilla,
} from '@jmondi/oauth2-server/vanilla';
import {
  OAuthError,
  OAuthErrorCode,
  requireBearerAuth,
} from '@modelcontextprotocol/server';

export class AuthorizationInputError extends Error {
  constructor(message, oauthError = 'invalid_request') {
    super(message);
    this.oauthError = oauthError;
  }
}

export const SCOPE = { name: 'mcp:read' };
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
    if (this.failCommit)
      throw new AuthorizationInputError('injected commit failure');
    const next = stageNextState(this, work);
    if (this.failStagedCommit)
      throw new AuthorizationInputError('injected staged commit failure');
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
      throw new AuthorizationInputError('code conflict', 'invalid_grant');
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
      throw new AuthorizationInputError('refresh conflict', 'invalid_grant');
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
    throw new AuthorizationInputError(`invalid ${key}`);
  return values[0];
}
function exactResource(params, resource) {
  if (
    params.has('aud') ||
    params.has('audience') ||
    one(params, 'resource', true) !== resource
  )
    throw new AuthorizationInputError('invalid resource');
}
function exactRedirect(params, client) {
  const redirect = one(params, 'redirect_uri', true);
  if (
    !client ||
    !client.redirectUris.includes(redirect) ||
    redirect.includes('#')
  )
    throw new AuthorizationInputError('invalid redirect_uri');
}
function scopeInput(params) {
  const scope = one(params, 'scope');
  if (scope !== undefined && scope !== SCOPE.name)
    throw new AuthorizationInputError('invalid scope');
}

export function createAuthorizationServer(store, config, user) {
  const {
    resource: RESOURCE,
    issuer: ISSUER,
    clients,
    signingSecret,
    verifyUser,
  } = config;
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
    const jwt = new JwtService(signingSecret);
    jwt.extraTokenFields = async ({ originatingAuthCodeId }) => {
      const grant = codeRecord(originatingAuthCodeId);
      if (!grant || grant.resource !== RESOURCE)
        throw new AuthorizationInputError('unbound grant');
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
        token.refreshTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
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
    server.enableGrantType('refresh_token', new DateInterval('5m'));
    server.enableGrantType(
      {
        grant: 'authorization_code',
        authCodeTTL: new DateInterval('5m'),
        authCodeRepository: codeRepo,
        userRepository: {
          getUserByCredentials: async (id) =>
            (credential?.user ?? user)?.id === id
              ? clone(credential?.user ?? user)
              : undefined,
        },
      },
      new DateInterval('5m'),
    );
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
      exactResource(params, RESOURCE);
      const client = clients.find(
        (c) => c.id === one(params, 'client_id', true),
      );
      exactRedirect(params, client);
      if (one(params, 'scope', true) !== SCOPE.name)
        throw new AuthorizationInputError('invalid scope');
      const op = operation();
      const auth = await op.server.validateAuthorizationRequest(
        await requestFromVanilla(request),
      );
      if (!user || !(await verifyUser(user)))
        throw new AuthorizationInputError('Invalid identity');
      auth.user = user;
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
        throw new AuthorizationInputError('invalid token query');
      const params = new URLSearchParams(await request.clone().text());
      const allowed = new Set([
        'grant_type',
        'client_id',
        'resource',
        'scope',
        'code',
        'redirect_uri',
        'code_verifier',
        'refresh_token',
      ]);
      if (
        [...params.keys()].some(
          (key) => !allowed.has(key) || params.getAll(key).length !== 1,
        )
      )
        throw new AuthorizationInputError('invalid token parameters');
      exactResource(params, RESOURCE);
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
        record.revoked ||
        (record.expiresAt ?? record.refreshTokenExpiresAt)?.getTime() <=
          Date.now() ||
        record.resource !== RESOURCE ||
        record.client.id !== clientId
      )
        throw new AuthorizationInputError(
          'credential mismatch',
          'invalid_grant',
        );
      if (grant === 'authorization_code') {
        const client = clients.find((c) => c.id === clientId);
        exactRedirect(params, client);
      }
      const op = operation();
      if (!(await verifyUser(record.user)))
        throw new AuthorizationInputError('Invalid identity', 'invalid_grant');
      op.setCredential({ client: record.client, user: record.user });
      const response = responseToVanilla(
        await op.server.respondToAccessTokenRequest(
          await requestFromVanilla(request),
        ),
      );
      await store.commit(op.work);
      return response;
    },
    async authenticate(request) {
      const jwt = new JwtService(signingSecret);
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
            if (!(await verifyUser(record.user)))
              throw new OAuthError(
                OAuthErrorCode.InvalidToken,
                'Inactive identity',
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
        resourceMetadataUrl: `${ISSUER}/.well-known/oauth-protected-resource/mcp`,
      });
      const result = await gate(request);
      if (result instanceof Response) return result;
      const payload = await jwt.verify(result.token, {
        issuer: ISSUER,
        audience: RESOURCE,
      });
      return clone(store.tokens.get(payload.jti).user);
    },
  };
}
