import { createHmac, timingSafeEqual } from 'node:crypto';
import { consentAgeMs, maximumBodyBytes } from './config';

export function spikeResponse(
  body: BodyInit | null,
  status = 200,
  headers?: HeadersInit,
) {
  const result = new Headers(headers);
  result.set('Cache-Control', 'no-store');
  result.set('CDN-Cache-Control', 'no-store');
  result.set('Netlify-CDN-Cache-Control', 'no-store');
  result.set('Referrer-Policy', 'no-referrer');
  result.set('X-Content-Type-Options', 'nosniff');
  result.set(
    'Content-Security-Policy',
    "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  );
  return new Response(body, { status, headers: result });
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function limitedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBodyBytes) {
      await reader.cancel();
      throw new RequestBodyError('Body limit exceeded', 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new RequestBodyError('Invalid UTF-8 request', 400);
  }
}

function signature(
  secret: string,
  uid: string,
  query: string,
  timestamp: string,
) {
  return createHmac('sha256', secret)
    .update(JSON.stringify([uid, query, timestamp]))
    .digest('hex');
}

export function consentProof(
  secret: string,
  uid: string,
  query: string,
  now = Date.now(),
) {
  const timestamp = String(now);
  return `${timestamp}.${signature(secret, uid, query, timestamp)}`;
}

export function verifyConsent(
  secret: string,
  uid: string,
  query: string,
  proof: string,
  now = Date.now(),
) {
  const [timestamp, mac, extra] = proof.split('.');
  if (
    extra ||
    !/^\d{13}$/.test(timestamp ?? '') ||
    !/^[a-f0-9]{64}$/.test(mac ?? '')
  )
    return false;
  const age = now - Number(timestamp);
  if (age < 0 || age > consentAgeMs) return false;
  return timingSafeEqual(
    Buffer.from(mac, 'hex'),
    Buffer.from(signature(secret, uid, query, timestamp), 'hex'),
  );
}

export function consentPage(
  title: string,
  message: string,
  proof: string,
  actionLabel: string,
  callback?: string,
) {
  const response = spikeResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><form method="post"><input type="hidden" name="proof" value="${escapeHtml(proof)}"><button name="decision" value="approve">${escapeHtml(actionLabel)}</button><button name="decision" value="deny">Cancel</button></form></main></body></html>`,
    200,
    { 'Content-Type': 'text/html; charset=utf-8' },
  );
  // Chromium sends Origin: null for form submissions under no-referrer.
  response.headers.set('Referrer-Policy', 'same-origin');
  if (callback) {
    // Chromium also applies form-action to the OAuth redirect.
    response.headers.set(
      'Content-Security-Policy',
      `default-src 'none'; form-action 'self' ${new URL(callback).origin}; frame-ancestors 'none'; base-uri 'none'`,
    );
  }
  return response;
}
