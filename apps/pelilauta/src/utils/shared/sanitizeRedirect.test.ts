import { describe, expect, it } from 'vitest';
import { sanitizeRedirect } from './sanitizeRedirect';

describe('sanitizeRedirect', () => {
  it('passes a relative path through', () => {
    expect(sanitizeRedirect('/threads/abc')).toBe('/threads/abc');
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

  it('discards protocol-relative values', () => {
    expect(sanitizeRedirect('//evil.example')).toBe('/');
    expect(sanitizeRedirect('/\\evil.example')).toBe('/');
  });
});
