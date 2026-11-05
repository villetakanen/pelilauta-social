import type { APIContext } from 'astro';
import { spikeConfig } from './config';
import { spikeResponse } from './http';

export async function spikeRoute(context: APIContext, endpoint: string) {
  context.locals.authenticationDependent = true;
  const config = spikeConfig(
    {
      PUBLIC_projectId: import.meta.env.PUBLIC_projectId,
      SECRET_MCP_SPIKE_ENABLED: import.meta.env.SECRET_MCP_SPIKE_ENABLED,
      SECRET_MCP_SPIKE_ORIGIN: import.meta.env.SECRET_MCP_SPIKE_ORIGIN,
      SECRET_MCP_SPIKE_NAMESPACE: import.meta.env.SECRET_MCP_SPIKE_NAMESPACE,
      SECRET_MCP_SPIKE_SIGNING_SECRET: import.meta.env
        .SECRET_MCP_SPIKE_SIGNING_SECRET,
      SECRET_MCP_SPIKE_CLIENTS: import.meta.env.SECRET_MCP_SPIKE_CLIENTS,
      SECRET_MCP_SPIKE_USERS: import.meta.env.SECRET_MCP_SPIKE_USERS,
    },
    import.meta.env.DEV,
  );
  if (!config) return spikeResponse('Not found', 404);
  try {
    const [{ spikeDependencies }, { handleSpikeRequest }] = await Promise.all([
      import('./runtime'),
      import('./handler'),
    ]);
    return await handleSpikeRequest(
      context.request,
      endpoint,
      config,
      await spikeDependencies(config, context),
    );
  } catch {
    return spikeResponse('MCP test service unavailable', 503);
  }
}
