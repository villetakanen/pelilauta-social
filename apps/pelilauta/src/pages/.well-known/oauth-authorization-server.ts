import type { APIRoute } from 'astro';
import { spikeRoute } from 'src/site/server/mcp/route';

export const ALL: APIRoute = (context) => spikeRoute(context, 'metadata');
