import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CLAUDE_CODE_CALLBACK,
  CLAUDE_CODE_CLIENT_ID,
} from '../src/site/server/mcp/environment.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = {
  SECRET_MCP_SPIKE_ENABLED: 'true',
  PUBLIC_projectId: 'skaldbase-test',
  SECRET_MCP_SPIKE_ORIGIN: 'https://proof-214.netlify.app',
  SECRET_MCP_SPIKE_NAMESPACE: '0d2df263-659b-4d53-988a-0c9218a4055b',
  SECRET_MCP_SPIKE_SIGNING_SECRET:
    'test-only-build-signing-secret-not-for-cloud-1234567890',
  SECRET_MCP_SPIKE_CLIENTS: JSON.stringify([
    {
      id: 'test-client',
      name: 'Adapter test',
      redirectUris: ['https://client.example/callback'],
    },
    {
      id: CLAUDE_CODE_CLIENT_ID,
      name: 'Claude Code adapter',
      redirectUris: [CLAUDE_CODE_CALLBACK],
    },
  ]),
  SECRET_MCP_SPIKE_USERS: JSON.stringify(['user-a']),
};
function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with ${result.status ?? result.signal}`);
}
function verify(enabled) {
  const env = { ...process.env };
  for (const key of Object.keys(fixture)) delete env[key];
  delete env.URL;
  delete env.DEPLOY_PRIME_URL;
  Object.assign(env, enabled ? fixture : { SECRET_MCP_SPIKE_ENABLED: 'false' });
  run('pnpm', ['--filter', 'pelilauta', 'build'], env);
  run(
    process.execPath,
    [
      'apps/pelilauta/test/netlify/mcp-spike.mjs',
      ...(enabled ? ['--enabled'] : []),
    ],
    env,
  );
}

try {
  verify(true);
} finally {
  // Leave the generated artifact with the exception disabled even if the proof fails.
  verify(false);
}
