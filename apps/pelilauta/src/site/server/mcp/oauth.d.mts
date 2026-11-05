export class AuthorizationInputError extends Error {
  readonly oauthError: string;
  constructor(message: string, oauthError?: string);
}
export interface GrantUser {
  id: string;
  authTime: number;
  grantedAt: number;
}
export interface AuthorizationConfig {
  issuer: string;
  resource: string;
  signingSecret: string;
  clients: {
    id: string;
    name: string;
    redirectUris: string[];
    allowedGrants: string[];
    scopes: { name: string }[];
  }[];
  verifyUser: (user: GrantUser) => Promise<boolean>;
}
export class Store {
  codes: Map<string, unknown>;
  tokens: Map<string, unknown>;
  refresh: Map<string, string>;
}
export function createAuthorizationServer(
  store: Store,
  config: AuthorizationConfig,
  user?: GrantUser,
): {
  authorize(request: Request): Promise<Response>;
  token(request: Request): Promise<Response>;
  authenticate(request: Request): Promise<Response | GrantUser>;
};
