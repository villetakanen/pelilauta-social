import { describe, expect, it } from 'vitest';
import { sanitizeRedirect } from '../../../src/utils/shared/sanitizeRedirect';

describe('sanitizeRedirect', () => {
  it.each([
    '/threads/abc',
    '/sites/example/handouts?view=list#latest',
    '/sites/example?redirect=https%3A%2F%2Fexample.com#latest',
    '/?q=%C3%A4%C3%B6#fragment',
    '/login-help',
  ])('preserves the path, query, and fragment of %s', (candidate) => {
    expect(sanitizeRedirect(candidate)).toBe(candidate);
  });

  it('normalizes paths before returning them', () => {
    expect(sanitizeRedirect('/sites/../threads/abc?view=list#latest')).toBe(
      '/threads/abc?view=list#latest',
    );
  });

  it.each([
    '/login',
    '/login/',
    '/login?redirect=%2Fsettings#latest',
    '/sites/../login',
    '/sites/%2e%2e/login',
    '/%6cogin',
    '/login%2f',
    '/sites%2f..%2flogin',
    '/LOGIN',
  ])('rejects recursive authentication destination %s', (candidate) => {
    expect(sanitizeRedirect(candidate)).toBe('/');
  });

  it.each([
    '/\tevil.example',
    '/\nevil.example',
    '/safe?value=\r',
    '/safe#\u0000',
    '/safe#\u007f',
    '/%0a/evil.example',
    '/safe?value=%0D',
    '/safe#%00',
    '/safe#%7F',
  ])('rejects control characters in %j', (candidate) => {
    expect(sanitizeRedirect(candidate)).toBe('/');
  });

  it('falls back to the front page on empty values', () => {
    expect(sanitizeRedirect(null)).toBe('/');
    expect(sanitizeRedirect(undefined)).toBe('/');
    expect(sanitizeRedirect('')).toBe('/');
  });

  it('discards absolute URLs', () => {
    expect(sanitizeRedirect('https://evil.example')).toBe('/');
    expect(sanitizeRedirect('http://evil.example/login')).toBe('/');
  });

  it.each([
    '//evil.example',
    '//pelilauta.invalid/threads',
    '/\\pelilauta.invalid/threads',
    '/\\\\evil.example',
    '/a/..//evil.example',
    '/%2f%2fevil.example',
    '/%5cevil.example',
  ])('discards off-origin or ambiguous destination %s', (candidate) => {
    expect(sanitizeRedirect(candidate)).toBe('/');
  });

  it('rejects malformed path encoding', () => {
    expect(sanitizeRedirect('/%')).toBe('/');
  });
});
