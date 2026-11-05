import { describe, expect, it } from 'vitest';
import { spikeOrigin } from '../../../../src/site/server/mcp/environment.mjs';
import { spikeOriginCheck } from '../../../../src/site/server/mcp/origin-check';

const issuer = 'https://proof-214.netlify.app';
const env = {
  SECRET_MCP_SPIKE_ENABLED: 'true',
  PUBLIC_projectId: 'skaldbase-test',
  SECRET_MCP_SPIKE_ORIGIN: issuer,
};

function request(
  path: string,
  method: string,
  origin?: string,
  contentType?: string,
) {
  const headers = new Headers();
  if (origin !== undefined) headers.set('Origin', origin);
  if (contentType !== undefined) headers.set('Content-Type', contentType);
  return new Request(`${issuer}${path}`, { method, headers });
}
function denied(
  req: Request,
  exceptionOrigin: string | null = issuer,
  prerendered = false,
) {
  return spikeOriginCheck(req, new URL(req.url), prerendered, exceptionOrigin)
    ?.status;
}

describe('test-project OAuth origin exception', () => {
  it('requires explicit test-project and test-origin configuration at build time', () => {
    expect(spikeOrigin(env)).toBe(issuer);
    expect(
      spikeOrigin({ ...env, SECRET_MCP_SPIKE_ENABLED: undefined }),
    ).toBeNull();
    expect(spikeOrigin({ ...env, PUBLIC_projectId: 'production' })).toBeNull();
    expect(
      spikeOrigin({
        ...env,
        SECRET_MCP_SPIKE_ORIGIN: 'https://pelilauta.social',
      }),
    ).toBeNull();
    expect(
      spikeOrigin({
        ...env,
        SECRET_MCP_SPIKE_ORIGIN: 'https://proof-214.netlify.app.evil.example',
      }),
    ).toBeNull();
    expect(
      spikeOrigin({ ...env, SECRET_MCP_SPIKE_ORIGIN: 'http://localhost:4321' }),
    ).toBeNull();
    expect(
      spikeOrigin(
        { ...env, SECRET_MCP_SPIKE_ORIGIN: 'http://localhost:4321' },
        true,
      ),
    ).toBe('http://localhost:4321');
  });

  it('exempts only originless form POSTs to the exact token endpoint and configured origin', () => {
    const req = request(
      '/mcp/token',
      'POST',
      undefined,
      'application/x-www-form-urlencoded; charset=UTF-8',
    );
    expect(denied(req)).toBeUndefined();
    expect(denied(req, 'https://another.netlify.app')).toBe(403);
    for (const path of [
      '/mcp/token/',
      '/mcp/token/other',
      '/mcp/authorize',
      '/mcp/disconnect',
      '/api/auth/session',
    ]) {
      expect(
        denied(
          request(path, 'POST', undefined, 'application/x-www-form-urlencoded'),
        ),
      ).toBe(403);
    }
    for (const origin of ['', 'null', 'https://evil.example']) {
      expect(
        denied(
          request(
            '/mcp/token',
            'POST',
            origin,
            'application/x-www-form-urlencoded',
          ),
        ),
      ).toBe(403);
    }
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      expect(
        denied(
          request(
            '/mcp/token',
            method,
            undefined,
            'application/x-www-form-urlencoded',
          ),
        ),
      ).toBe(403);
    }
    expect(denied(request('/mcp/token', 'POST'))).toBe(403);
    expect(denied(request('/mcp/token', 'POST', undefined, 'text/plain'))).toBe(
      403,
    );
  });

  it('preserves Astro form checks, safe methods and non-form requests outside the exception', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const contentType of [
        undefined,
        'application/x-www-form-urlencoded',
        'multipart/form-data; boundary=test',
        'TEXT/PLAIN; charset=utf-8',
      ]) {
        for (const origin of [undefined, 'null', 'https://evil.example']) {
          expect(
            denied(request('/api/auth/session', method, origin, contentType)),
          ).toBe(403);
        }
        expect(
          denied(request('/api/auth/session', method, issuer, contentType)),
        ).toBeUndefined();
      }
      for (const contentType of [
        '',
        'application/json',
        'application/octet-stream',
      ]) {
        expect(
          denied(
            request(
              '/api/auth/session',
              method,
              'https://evil.example',
              contentType,
            ),
          ),
        ).toBeUndefined();
      }
    }
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(
        denied(
          request(
            '/mcp/authorize',
            method,
            'https://evil.example',
            'text/plain',
          ),
        ),
      ).toBeUndefined();
    }
    expect(
      denied(request('/mcp/authorize', 'POST', undefined, 'text/plain'), null),
    ).toBeUndefined();
    expect(
      denied(
        request('/mcp/authorize', 'POST', undefined, 'text/plain'),
        issuer,
        true,
      ),
    ).toBeUndefined();
  });
});
