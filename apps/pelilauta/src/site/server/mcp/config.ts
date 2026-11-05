import { z } from 'zod';
import {
  CLAUDE_CODE_CALLBACK,
  CLAUDE_CODE_CLIENT_ID,
  spikeOrigin,
} from './environment.mjs';

const redirect = z
  .string()
  .max(2048)
  .refine((value) => {
    if (value === CLAUDE_CODE_CALLBACK) return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' && !url.hash && !url.username && !url.password
      );
    } catch {
      return false;
    }
  });
const client = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(100),
    redirectUris: z.array(redirect).min(1).max(4),
  })
  .refine(
    (value) =>
      !value.redirectUris.includes(CLAUDE_CODE_CALLBACK) ||
      value.id === CLAUDE_CODE_CLIENT_ID,
  );
const uuid = z.uuid({ version: 'v4' });

export type SpikeConfig = NonNullable<ReturnType<typeof spikeConfig>>;

export function spikeConfig(env: Record<string, unknown>, development = false) {
  const origin = spikeOrigin(env, development);
  if (!origin) return null;
  try {
    const clients = z
      .array(client)
      .min(1)
      .max(4)
      .parse(
        JSON.parse(z.string().max(20000).parse(env.SECRET_MCP_SPIKE_CLIENTS)),
      );
    if (new Set(clients.map((item) => item.id)).size !== clients.length)
      return null;
    const users = z
      .array(z.string().min(1).max(128))
      .min(1)
      .max(4)
      .parse(
        JSON.parse(z.string().max(2000).parse(env.SECRET_MCP_SPIKE_USERS)),
      );
    return {
      issuer: origin,
      resource: `${origin}/mcp`,
      namespace: uuid.parse(env.SECRET_MCP_SPIKE_NAMESPACE),
      signingSecret: z
        .string()
        .min(48)
        .max(256)
        .parse(env.SECRET_MCP_SPIKE_SIGNING_SECRET),
      clients: clients.map((item) => ({
        ...item,
        allowedGrants: ['authorization_code', 'refresh_token'],
        scopes: [{ name: 'mcp:read' }],
      })),
      users,
    };
  } catch {
    return null;
  }
}

export const fixtureSites = ['mcp-proof-214-a', 'mcp-proof-214-b'] as const;
export const namespaceCollection = 'mcpAuthorizationProof214';
export const maximumBodyBytes = 16 * 1024;
export const maximumPageBytes = 8 * 1024;
export const maximumGrantAgeMs = 60 * 60 * 1000;
export const consentAgeMs = 5 * 60 * 1000;
