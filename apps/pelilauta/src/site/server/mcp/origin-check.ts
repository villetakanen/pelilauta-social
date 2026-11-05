export function spikeOriginCheck(
  request: Request,
  url: URL,
  isPrerendered: boolean,
  exceptionOrigin: string | null | undefined,
): Response | undefined {
  if (
    !exceptionOrigin ||
    isPrerendered ||
    ['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  )
    return;
  const contentType = request.headers.get('content-type');
  if (
    request.method === 'POST' &&
    url.origin === exceptionOrigin &&
    url.pathname === '/mcp/token' &&
    !request.headers.has('origin') &&
    contentType?.split(';')[0].trim().toLowerCase() ===
      'application/x-www-form-urlencoded'
  )
    return;

  // Match Astro's form-origin policy outside the originless token exchange.
  const formLike =
    contentType === null ||
    [
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
    ].some((type) => contentType.toLowerCase().includes(type));
  if (formLike && request.headers.get('origin') !== url.origin) {
    return new Response(
      `Cross-site ${request.method} form submissions are forbidden`,
      { status: 403 },
    );
  }
}
