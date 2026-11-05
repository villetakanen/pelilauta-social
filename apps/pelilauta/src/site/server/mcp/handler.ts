import { OAuthException } from '@jmondi/oauth2-server';
import {
  createMcpHandler,
  fromJsonSchema,
  McpServer,
} from '@modelcontextprotocol/server';
import type { APIContext } from 'astro';
import type { SessionVerification } from 'src/utils/server/auth/verifySession';
import { z } from 'zod';
import { fixtureSites, maximumPageBytes, type SpikeConfig } from './config';
import { CLAUDE_CODE_CALLBACK } from './environment.mjs';
import {
  consentPage,
  consentProof,
  limitedBody,
  RequestBodyError,
  spikeResponse,
  verifyConsent,
} from './http';
import type { GrantUser, Store } from './oauth.mjs';
import {
  AuthorizationInputError,
  createAuthorizationServer,
} from './oauth.mjs';

export interface SpikeDependencies {
  session(): Promise<SessionVerification>;
  loadStore(): Promise<Store>;
  verifyUser(user: GrantUser): Promise<boolean>;
  disconnect(uid: string): Promise<void>;
  readPage(
    uid: string,
    siteKey: string,
  ): Promise<{ title: string; markdown: string } | null>;
}

function authorizationClient(request: Request, config: SpikeConfig) {
  const params = new URL(request.url).searchParams;
  const allowed = new Set([
    'client_id',
    'redirect_uri',
    'resource',
    'response_type',
    'scope',
    'code_challenge',
    'code_challenge_method',
    'state',
  ]);
  if (
    [...params.keys()].some(
      (key) => !allowed.has(key) || params.getAll(key).length !== 1,
    )
  )
    return null;
  const client = config.clients.find(
    (item) => item.id === params.get('client_id'),
  );
  if (
    !client ||
    !client.redirectUris.includes(params.get('redirect_uri') ?? '') ||
    params.get('resource') !== config.resource ||
    params.get('response_type') !== 'code' ||
    params.get('scope') !== 'mcp:read' ||
    params.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') ?? '') ||
    (params.get('state')?.length ?? 0) > 512
  )
    return null;
  return client;
}

export async function handleSpikeRequest(
  request: Request,
  endpoint: string,
  config: SpikeConfig,
  deps: SpikeDependencies,
) {
  const url = new URL(request.url);
  if (url.origin !== config.issuer || url.href.length > 8192)
    return spikeResponse('Not found', 404);
  const origin = request.headers.get('origin');
  if (origin && origin !== config.issuer)
    return spikeResponse('Forbidden', 403);
  try {
    if (request.method === 'GET' && endpoint === 'resource-metadata') {
      return spikeResponse(
        JSON.stringify({
          resource: config.resource,
          authorization_servers: [config.issuer],
          scopes_supported: ['mcp:read'],
          bearer_methods_supported: ['header'],
        }),
        200,
        { 'Content-Type': 'application/json' },
      );
    }
    if (request.method === 'GET' && endpoint === 'metadata') {
      return spikeResponse(
        JSON.stringify({
          issuer: config.issuer,
          authorization_endpoint: `${config.issuer}/mcp/authorize`,
          token_endpoint: `${config.issuer}/mcp/token`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          token_endpoint_auth_methods_supported: ['none'],
          code_challenge_methods_supported: ['S256'],
          scopes_supported: ['mcp:read'],
        }),
        200,
        { 'Content-Type': 'application/json' },
      );
    }
    if (endpoint === 'authorize' || endpoint === 'disconnect') {
      if (request.method !== 'GET' && request.method !== 'POST')
        return spikeResponse('Method not allowed', 405, { Allow: 'GET, POST' });
      const client =
        endpoint === 'authorize' ? authorizationClient(request, config) : null;
      if (endpoint === 'authorize' && !client)
        return spikeResponse('Invalid authorization request', 400);
      if (endpoint === 'disconnect' && url.search)
        return spikeResponse('Invalid request', 400);
      const session = await deps.session();
      if (session.status !== 'verified') {
        if (session.status !== 'rejected')
          return spikeResponse('Authentication unavailable', 503);
        if (request.method === 'POST')
          return spikeResponse('Unauthorized', 401);
        return spikeResponse(null, 303, {
          Location: `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`,
        });
      }
      const uid = session.token.uid;
      if (!config.users.includes(uid)) return spikeResponse('Forbidden', 403);
      const query = `${endpoint}:${url.search}`;
      if (request.method === 'GET') {
        return consentPage(
          client ? 'Allow read-only MCP access' : 'Disconnect MCP access',
          client
            ? `${client.name} (${new URL(url.searchParams.get('redirect_uri') ?? '').host}) requests read-only access to the two MCP test sites as ${uid}. This development grant lasts one hour. Browser logout does not disconnect it.${url.searchParams.get('redirect_uri') === CLAUDE_CODE_CALLBACK ? ' Continue only if you started this connection in Claude Code.' : ''}`
            : `Disconnect every MCP test grant for ${uid}.`,
          consentProof(config.signingSecret, uid, query),
          client ? 'Allow read-only access' : 'Disconnect',
          client
            ? (url.searchParams.get('redirect_uri') ?? undefined)
            : undefined,
        );
      }
      if (
        origin !== config.issuer ||
        !request.headers
          .get('content-type')
          ?.startsWith('application/x-www-form-urlencoded')
      )
        return spikeResponse('Forbidden', 403);
      const form = new URLSearchParams(await limitedBody(request));
      if (
        form.getAll('proof').length !== 1 ||
        form.getAll('decision').length !== 1 ||
        !verifyConsent(
          config.signingSecret,
          uid,
          query,
          form.get('proof') ?? '',
        )
      )
        return spikeResponse('Invalid consent', 403);
      if (form.get('decision') === 'deny') return spikeResponse('Cancelled');
      if (form.get('decision') !== 'approve')
        return spikeResponse('Invalid decision', 400);
      if (endpoint === 'disconnect') {
        await deps.disconnect(uid);
        return spikeResponse('MCP test connections disconnected.');
      }
      const user = {
        id: uid,
        authTime: session.token.auth_time,
        grantedAt: Date.now(),
      };
      const server = createAuthorizationServer(
        await deps.loadStore(),
        { ...config, verifyUser: deps.verifyUser },
        user,
      );
      const response = await server.authorize(new Request(url));
      return spikeResponse(response.body, response.status, response.headers);
    }
    if (endpoint === 'token') {
      if (request.method !== 'POST')
        return spikeResponse('Method not allowed', 405, { Allow: 'POST' });
      if (
        !request.headers
          .get('content-type')
          ?.startsWith('application/x-www-form-urlencoded')
      )
        return spikeResponse('Invalid content type', 415);
      const body = await limitedBody(request);
      const server = createAuthorizationServer(await deps.loadStore(), {
        ...config,
        verifyUser: deps.verifyUser,
      });
      const response = await server.token(
        new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body,
        }),
      );
      return spikeResponse(response.body, response.status, response.headers);
    }
    if (endpoint !== '') return spikeResponse('Not found', 404);
    if (
      !/^Bearer [A-Za-z0-9_.-]{1,4096}$/.test(
        request.headers.get('authorization') ?? '',
      )
    ) {
      return spikeResponse('Unauthorized', 401, {
        'WWW-Authenticate': `Bearer resource_metadata="${config.issuer}/.well-known/oauth-protected-resource/mcp"`,
      });
    }
    const server = createAuthorizationServer(await deps.loadStore(), {
      ...config,
      verifyUser: deps.verifyUser,
    });
    const user = await server.authenticate(request);
    if (user instanceof Response)
      return spikeResponse(user.body, user.status, user.headers);
    if (request.method !== 'POST')
      return spikeResponse('Method not allowed', 405, { Allow: 'POST' });
    const handler = createMcpHandler(
      () => {
        const mcp = new McpServer({
          name: 'pelilauta-214-spike',
          version: '0.0.0',
        });
        mcp.registerTool(
          'read_fixture_page',
          {
            description:
              'Read one current page from an authorized MCP test site.',
            inputSchema: fromJsonSchema({
              type: 'object',
              properties: {
                siteKey: { type: 'string', enum: [...fixtureSites] },
              },
              required: ['siteKey'],
              additionalProperties: false,
            }),
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              openWorldHint: false,
            },
          },
          async (input) => {
            const { siteKey } = z
              .object({ siteKey: z.enum(fixtureSites) })
              .strict()
              .parse(input);
            try {
              const page = (await deps.verifyUser(user))
                ? await deps.readPage(user.id, siteKey)
                : null;
              if (
                !page ||
                Buffer.byteLength(page.markdown, 'utf8') > maximumPageBytes
              ) {
                return {
                  isError: true,
                  content: [{ type: 'text', text: 'Fixture unavailable.' }],
                };
              }
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      title: page.title,
                      markdown: page.markdown,
                      url: `${config.issuer}/sites/${siteKey}/proof`,
                    }),
                  },
                ],
              };
            } catch {
              return {
                isError: true,
                content: [
                  { type: 'text', text: 'Fixture temporarily unavailable.' },
                ],
              };
            }
          },
        );
        return mcp;
      },
      {
        legacy: 'stateless',
        responseMode: 'json',
        maxRequestBodySize: 16 * 1024,
        maxSubscriptions: 0,
      },
    );
    try {
      const response = await handler.fetch(request);
      return spikeResponse(response.body, response.status, response.headers);
    } finally {
      await handler.close();
    }
  } catch (error) {
    if (error instanceof RequestBodyError)
      return spikeResponse(error.message, error.status);
    if (
      !(error instanceof AuthorizationInputError) &&
      !(error instanceof OAuthException)
    ) {
      return spikeResponse('MCP test service unavailable', 503);
    }
    const oauthError =
      error instanceof AuthorizationInputError
        ? error.oauthError
        : error.errorType;
    const code = [
      'invalid_grant',
      'invalid_client',
      'invalid_scope',
      'unsupported_grant_type',
    ].includes(oauthError)
      ? oauthError
      : 'invalid_request';
    return spikeResponse(JSON.stringify({ error: code }), 400, {
      'Content-Type': 'application/json',
    });
  }
}

export type SpikeContext = Pick<APIContext, 'request' | 'locals'>;
