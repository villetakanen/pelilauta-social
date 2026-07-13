import { generateSrcset, netlifyImage } from '@utils/images/netlifyImage';
import { describe, expect, it } from 'vitest';

describe('netlifyImage', () => {
  const firebaseUrl = 'https://storage.googleapis.com/bucket/path/image.jpg';

  it('should generate basic Netlify image URL', () => {
    const result = netlifyImage(firebaseUrl);

    expect(result).toContain('/.netlify/images');
    expect(result).toContain('url=');
    expect(result).toContain(encodeURIComponent(firebaseUrl));
  });

  it('should add width parameter', () => {
    const result = netlifyImage(firebaseUrl, { width: 800 });

    expect(result).toContain('w=800');
  });

  it('should add height parameter', () => {
    const result = netlifyImage(firebaseUrl, { height: 600 });

    expect(result).toContain('h=600');
  });

  it('should add format parameter', () => {
    const result = netlifyImage(firebaseUrl, { format: 'webp' });

    expect(result).toContain('fm=webp');
  });

  it('should add quality parameter', () => {
    const result = netlifyImage(firebaseUrl, { quality: 85 });

    expect(result).toContain('q=85');
  });

  it('should add fit parameter', () => {
    const result = netlifyImage(firebaseUrl, { fit: 'cover' });

    expect(result).toContain('fit=cover');
  });

  it('should add position parameter', () => {
    const result = netlifyImage(firebaseUrl, { position: 'center' });

    expect(result).toContain('position=center');
  });

  it('should combine multiple parameters', () => {
    const result = netlifyImage(firebaseUrl, {
      width: 800,
      height: 600,
      format: 'webp',
      quality: 85,
      fit: 'cover',
    });

    expect(result).toContain('w=800');
    expect(result).toContain('h=600');
    expect(result).toContain('fm=webp');
    expect(result).toContain('q=85');
    expect(result).toContain('fit=cover');
  });

  it('should handle invalid width by rounding', () => {
    const result = netlifyImage(firebaseUrl, { width: 799.7 });

    expect(result).toContain('w=800');
  });

  it('should ignore negative width', () => {
    const result = netlifyImage(firebaseUrl, { width: -100 });

    expect(result).not.toContain('w=');
  });

  it('should ignore quality above 100', () => {
    const result = netlifyImage(firebaseUrl, { quality: 150 });

    expect(result).not.toContain('q=');
  });

  it('should return original URL for non-Firebase URLs', () => {
    const externalUrl = 'https://example.com/image.jpg';
    const result = netlifyImage(externalUrl);

    expect(result).toBe(externalUrl);
  });

  it('should return original URL for invalid input', () => {
    const result = netlifyImage('');

    expect(result).toBe('');
  });

  it('should handle firebasestorage.googleapis.com domain', () => {
    const firebaseStorageUrl =
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg';
    const result = netlifyImage(firebaseStorageUrl, { width: 800 });

    expect(result).toContain('/.netlify/images');
    expect(result).toContain('w=800');
  });

  it('should handle all format options', () => {
    const webp = netlifyImage(firebaseUrl, { format: 'webp' });
    const avif = netlifyImage(firebaseUrl, { format: 'avif' });
    const auto = netlifyImage(firebaseUrl, { format: 'auto' });

    expect(webp).toContain('fm=webp');
    expect(avif).toContain('fm=avif');
    expect(auto).toContain('fm=auto');
  });

  it('should handle all fit options', () => {
    const cover = netlifyImage(firebaseUrl, { fit: 'cover' });
    const contain = netlifyImage(firebaseUrl, { fit: 'contain' });
    const fill = netlifyImage(firebaseUrl, { fit: 'fill' });
    const inside = netlifyImage(firebaseUrl, { fit: 'inside' });
    const outside = netlifyImage(firebaseUrl, { fit: 'outside' });

    expect(cover).toContain('fit=cover');
    expect(contain).toContain('fit=contain');
    expect(fill).toContain('fit=fill');
    expect(inside).toContain('fit=inside');
    expect(outside).toContain('fit=outside');
  });

  it('should handle all position options', () => {
    const center = netlifyImage(firebaseUrl, { position: 'center' });
    const top = netlifyImage(firebaseUrl, { position: 'top' });
    const bottom = netlifyImage(firebaseUrl, { position: 'bottom' });
    const left = netlifyImage(firebaseUrl, { position: 'left' });
    const right = netlifyImage(firebaseUrl, { position: 'right' });

    expect(center).toContain('position=center');
    expect(top).toContain('position=top');
    expect(bottom).toContain('position=bottom');
    expect(left).toContain('position=left');
    expect(right).toContain('position=right');
  });

  it('should ignore zero width', () => {
    const result = netlifyImage(firebaseUrl, { width: 0 });

    expect(result).not.toContain('w=');
  });

  it('should ignore zero height', () => {
    const result = netlifyImage(firebaseUrl, { height: 0 });

    expect(result).not.toContain('h=');
  });

  it('should ignore zero quality', () => {
    const result = netlifyImage(firebaseUrl, { quality: 0 });

    expect(result).not.toContain('q=');
  });

  it('should round decimal height', () => {
    const result = netlifyImage(firebaseUrl, { height: 599.6 });

    expect(result).toContain('h=600');
  });

  it('should round decimal quality', () => {
    const result = netlifyImage(firebaseUrl, { quality: 84.7 });

    expect(result).toContain('q=85');
  });

  it('should handle quality at boundary value 100', () => {
    const result = netlifyImage(firebaseUrl, { quality: 100 });

    expect(result).toContain('q=100');
  });

  it('should handle quality at boundary value 1', () => {
    const result = netlifyImage(firebaseUrl, { quality: 1 });

    expect(result).toContain('q=1');
  });

  it('should ignore negative height', () => {
    const result = netlifyImage(firebaseUrl, { height: -200 });

    expect(result).not.toContain('h=');
  });

  it('should ignore negative quality', () => {
    const result = netlifyImage(firebaseUrl, { quality: -50 });

    expect(result).not.toContain('q=');
  });
});

describe('generateSrcset', () => {
  const firebaseUrl = 'https://storage.googleapis.com/bucket/path/image.jpg';

  it('should generate srcset for default widths', () => {
    const result = generateSrcset(firebaseUrl);

    expect(result).toContain('400w');
    expect(result).toContain('800w');
    expect(result).toContain('1600w');
  });

  it('should generate srcset for custom widths', () => {
    const result = generateSrcset(firebaseUrl, [200, 400]);

    expect(result).toContain('200w');
    expect(result).toContain('400w');
    expect(result).not.toContain('800w');
  });

  it('should apply format to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { format: 'webp' });

    expect(result).toContain('fm=webp');
    expect(result.match(/fm=webp/g)?.length).toBe(2);
  });

  it('should apply quality to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { quality: 85 });

    expect(result).toContain('q=85');
    expect(result.match(/q=85/g)?.length).toBe(2);
  });

  it('should format srcset correctly with commas', () => {
    const result = generateSrcset(firebaseUrl, [400, 800]);

    expect(result).toContain(',');
    expect(result.split(',').length).toBe(2);
  });

  it('should apply fit to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { fit: 'cover' });

    expect(result).toContain('fit=cover');
    expect(result.match(/fit=cover/g)?.length).toBe(2);
  });

  it('should apply position to all sizes', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], {
      position: 'center',
    });

    expect(result).toContain('position=center');
    expect(result.match(/position=center/g)?.length).toBe(2);
  });

  it('should handle single width', () => {
    const result = generateSrcset(firebaseUrl, [800]);

    expect(result).toContain('800w');
    expect(result).not.toContain(',');
  });

  it('should handle empty widths array', () => {
    const result = generateSrcset(firebaseUrl, []);

    expect(result).toBe('');
  });

  it('should combine multiple options', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], {
      format: 'webp',
      quality: 85,
      fit: 'cover',
      position: 'center',
    });

    expect(result).toContain('fm=webp');
    expect(result).toContain('q=85');
    expect(result).toContain('fit=cover');
    expect(result).toContain('position=center');
  });

  it('should return empty string for non-Firebase URLs', () => {
    const externalUrl = 'https://example.com/image.jpg';
    const result = generateSrcset(externalUrl, [400, 800]);

    // Should still generate srcset, but with original URLs
    expect(result).toContain(externalUrl);
    expect(result).toContain('400w');
    expect(result).toContain('800w');
  });

  it('should handle three default widths correctly', () => {
    const result = generateSrcset(firebaseUrl);
    const parts = result.split(',');

    expect(parts.length).toBe(3);
    expect(parts[0]).toContain('400w');
    expect(parts[1]).toContain('800w');
    expect(parts[2]).toContain('1600w');
  });

  it('should handle avif format', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { format: 'avif' });

    expect(result).toContain('fm=avif');
    expect(result.match(/fm=avif/g)?.length).toBe(2);
  });

  it('should handle auto format', () => {
    const result = generateSrcset(firebaseUrl, [400, 800], { format: 'auto' });

    expect(result).toContain('fm=auto');
    expect(result.match(/fm=auto/g)?.length).toBe(2);
  });
});
