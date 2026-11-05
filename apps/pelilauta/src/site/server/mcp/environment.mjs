export const CLAUDE_CODE_CLIENT_ID = 'claude-code';
export const CLAUDE_CODE_CALLBACK_PORT = 49176;
export const CLAUDE_CODE_CALLBACK = `http://localhost:${CLAUDE_CODE_CALLBACK_PORT}/callback`;

export function spikeOrigin(env, development = false) {
  if (
    env.SECRET_MCP_SPIKE_ENABLED !== 'true' ||
    env.PUBLIC_projectId !== 'skaldbase-test'
  )
    return null;
  try {
    if (typeof env.SECRET_MCP_SPIKE_ORIGIN !== 'string') return null;
    const url = new URL(env.SECRET_MCP_SPIKE_ORIGIN);
    if (
      url.origin !== env.SECRET_MCP_SPIKE_ORIGIN ||
      url.username ||
      url.password
    )
      return null;
    if (
      (url.protocol === 'https:' && url.hostname.endsWith('.netlify.app')) ||
      (development && url.origin === 'http://localhost:4321')
    )
      return url.origin;
  } catch {}
  return null;
}
