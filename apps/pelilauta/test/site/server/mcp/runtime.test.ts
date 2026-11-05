import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spikeConfig } from '../../../../src/site/server/mcp/config';
import type { SpikeContext } from '../../../../src/site/server/mcp/handler';
import type { GrantUser } from '../../../../src/site/server/mcp/oauth.mjs';
import { spikeDependencies } from '../../../../src/site/server/mcp/runtime';

const fake = vi.hoisted(() => ({
  projectId: 'skaldbase-test',
  getUser: vi.fn(),
  getNamespace: vi.fn(),
  getSite: vi.fn(),
  getPage: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('../../../../src/firebase/server', () => {
  const pageRef = { path: 'page', get: fake.getPage };
  const siteRef = {
    path: 'site',
    get: fake.getSite,
    collection: () => ({ doc: () => pageRef }),
  };
  const namespaceRef = { path: 'namespace', get: fake.getNamespace };
  const transaction = {
    get: (ref: { get: () => Promise<unknown> }) => ref.get(),
    update: fake.update,
  };
  return {
    serverDB: {
      get projectId() {
        return fake.projectId;
      },
      collection: (name: string) => ({
        doc: () => (name === 'sites' ? siteRef : namespaceRef),
      }),
      runTransaction: async (
        callback: (tx: typeof transaction) => Promise<unknown>,
      ) => callback(transaction),
    },
    serverAuth: { getUser: fake.getUser },
  };
});
const config = spikeConfig({
  SECRET_MCP_SPIKE_ENABLED: 'true',
  PUBLIC_projectId: 'skaldbase-test',
  SECRET_MCP_SPIKE_ORIGIN: 'https://proof-214.netlify.app',
  SECRET_MCP_SPIKE_NAMESPACE: '0d2df263-659b-4d53-988a-0c9218a4055b',
  SECRET_MCP_SPIKE_SIGNING_SECRET: 'test-only-signing-secret-'.repeat(3),
  SECRET_MCP_SPIKE_CLIENTS: JSON.stringify([
    {
      id: 'test',
      name: 'Test',
      redirectUris: ['https://client.example/callback'],
    },
  ]),
  SECRET_MCP_SPIKE_USERS: JSON.stringify(['user-a']),
});
if (!config) throw new Error('Invalid test configuration');
const context = {
  request: new Request(config.resource),
  locals: { resolveSession: vi.fn() },
} as unknown as SpikeContext;
const user = (): GrantUser => ({
  id: 'user-a',
  authTime: Math.floor(Date.now() / 1000),
  grantedAt: Date.now(),
});

beforeEach(() => {
  vi.clearAllMocks();
  fake.projectId = 'skaldbase-test';
  fake.getUser.mockResolvedValue({
    disabled: false,
    tokensValidAfterTime: '1970-01-01T00:00:00Z',
  });
  fake.getNamespace.mockResolvedValue({
    exists: true,
    data: () => ({ purpose: 'oauth-authorization-proof-214' }),
  });
  fake.getSite.mockResolvedValue({
    exists: true,
    data: () => ({ owners: ['user-a'], players: [] }),
  });
  fake.getPage.mockResolvedValue({
    exists: true,
    data: () => ({
      name: 'Proof',
      markdownContent: 'Hyvää päivää. Välkommen.',
    }),
  });
});

describe('MCP Firebase boundary', () => {
  it('refuses a backend project mismatch before reading Firebase', async () => {
    fake.projectId = 'production';
    await expect(spikeDependencies(config, context)).rejects.toThrow(
      'Invalid MCP test backend',
    );
    expect(fake.getUser).not.toHaveBeenCalled();
    expect(fake.getNamespace).not.toHaveBeenCalled();
  });

  it('checks current Firebase validity, grant age and the persisted disconnect cutoff', async () => {
    const deps = await spikeDependencies(config, context);
    const grant = user();
    expect(await deps.verifyUser(grant)).toBe(true);
    fake.getUser.mockResolvedValue({ disabled: true });
    expect(await deps.verifyUser(grant)).toBe(false);
    fake.getUser.mockRejectedValue({ code: 'auth/user-not-found' });
    expect(await deps.verifyUser(grant)).toBe(false);
    fake.getUser.mockResolvedValue({
      disabled: false,
      tokensValidAfterTime: new Date((grant.authTime + 1) * 1000).toISOString(),
    });
    expect(await deps.verifyUser(grant)).toBe(false);
    fake.getUser.mockResolvedValue({
      disabled: false,
      tokensValidAfterTime: '1970-01-01T00:00:00Z',
    });
    const key = createHash('sha256').update(grant.id).digest('hex');
    fake.getNamespace.mockResolvedValue({
      exists: true,
      data: () => ({
        purpose: 'oauth-authorization-proof-214',
        disconnections: { [key]: grant.grantedAt },
      }),
    });
    expect(await deps.verifyUser(grant)).toBe(false);
    expect(
      await deps.verifyUser({ ...grant, grantedAt: Date.now() - 3600001 }),
    ).toBe(false);
    expect(await deps.verifyUser({ ...grant, id: 'other-user' })).toBe(false);
  });

  it('does not accept a missing namespace or unrelated parent document', async () => {
    const deps = await spikeDependencies(config, context);
    fake.getNamespace.mockResolvedValue({ exists: false });
    expect(await deps.verifyUser(user())).toBe(false);
    await expect(deps.disconnect('user-a')).rejects.toThrow(
      'Missing test namespace',
    );
    fake.getNamespace.mockResolvedValue({
      exists: true,
      data: () => ({ purpose: 'unrelated' }),
    });
    expect(await deps.verifyUser(user())).toBe(false);
    expect(fake.update).not.toHaveBeenCalled();
  });

  it('limits disconnect to the verified account and writes no game data', async () => {
    const deps = await spikeDependencies(config, context);
    await deps.disconnect('user-a');
    const key = createHash('sha256').update('user-a').digest('hex');
    expect(fake.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'namespace' }),
      { [`disconnections.${key}`]: expect.any(Number) },
    );
    expect(fake.getSite).not.toHaveBeenCalled();
  });

  it('checks current site membership before reading and returns only page text and title', async () => {
    const deps = await spikeDependencies(config, context);
    expect(await deps.readPage('user-a', 'mcp-proof-214-a')).toEqual({
      title: 'Proof',
      markdown: 'Hyvää päivää. Välkommen.',
    });
    fake.getPage.mockClear();
    fake.getSite.mockResolvedValue({
      exists: true,
      data: () => ({ owners: ['other-user'] }),
    });
    expect(await deps.readPage('user-a', 'mcp-proof-214-a')).toBeNull();
    expect(fake.getPage).not.toHaveBeenCalled();
    expect(fake.update).not.toHaveBeenCalled();
  });
});
