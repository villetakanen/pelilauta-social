import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { createComponent, render } from 'astro/runtime/server/index.js';
import { onRequest } from 'src/middleware';

type Manifest = NonNullable<
  NonNullable<Parameters<typeof AstroContainer.create>[0]>['manifest']
>;

export async function createContainer() {
  const container = await AstroContainer.create({
    manifest: { middleware: () => ({ onRequest }) } as Manifest,
  });
  container.insertPageRoute(
    '/login',
    createComponent(async (result, props, slots) => {
      const astro = result.createAstro(props, slots);
      const recovery = astro.locals.protectedRecovery;
      if (recovery) astro.response.status = recovery.status;
      return render`<html>Recovery: ${recovery?.destination}</html>`;
    }),
  );
  return container;
}

export async function renderEndpoint(
  handler: APIRoute,
  request = new Request('https://example.com/test'),
) {
  const container = await createContainer();
  return container.renderToResponse(
    { [request.method]: handler } as unknown as Parameters<
      typeof container.renderToResponse
    >[0],
    { request, routeType: 'endpoint' },
  );
}

export function sessionRequest(cookie?: string, path = '/test') {
  return new Request(`https://example.com${path}`, {
    headers: cookie ? { Cookie: `session=${cookie}` } : {},
  });
}
