import { createAuthorizationServer } from '../../apps/pelilauta/src/site/server/mcp/oauth.mjs';

export {
  Store,
  stageNextState,
} from '../../apps/pelilauta/src/site/server/mcp/oauth.mjs';
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

export function createProofServer(store, uid = 'verified-test-user') {
  const server = createAuthorizationServer(
    store,
    {
      resource: RESOURCE,
      issuer: ISSUER,
      clients,
      signingSecret: 'proof-signing-secret-at-least-32-characters',
      verifyUser: async (user) =>
        ['user-a', 'user-b', 'verified-test-user'].includes(user?.id),
    },
    { id: uid },
  );
  return {
    authorize: server.authorize,
    token: server.token,
    async dispatch(request) {
      const result = await server.authenticate(request);
      return result instanceof Response
        ? result
        : new Response('tool-dispatched');
    },
  };
}
