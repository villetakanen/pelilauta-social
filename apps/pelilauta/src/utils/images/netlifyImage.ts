import { logWarn } from '@utils/logHelpers';

export interface NetlifyImageOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Transform Firebase Storage URL to Netlify Image CDN URL with optimization
 *
 * @param firebaseUrl - Full Firebase Storage URL
 * @param options - Image transformation options
 * @returns Netlify Image CDN URL with query parameters
 *
 * @example
 * ```ts
 * const optimized = netlifyImage(url, { width: 800, format: 'webp' });
 * // Returns: /.netlify/images?url=...&w=800&fm=webp
 * ```
 */
export function netlifyImage(
  firebaseUrl: string,
  options: NetlifyImageOptions = {},
): string {
  // Validate input
  if (!firebaseUrl || typeof firebaseUrl !== 'string') {
    logWarn('netlifyImage', 'Invalid URL provided:', firebaseUrl);
    return firebaseUrl;
  }

  // Ensure URL is from Firebase Storage
  if (
    !firebaseUrl.includes('storage.googleapis.com') &&
    !firebaseUrl.includes('firebasestorage.googleapis.com')
  ) {
    logWarn('netlifyImage', 'URL is not from Firebase Storage:', firebaseUrl);
    return firebaseUrl;
  }

  // Build query parameters
  const params = new URLSearchParams();
  params.set('url', firebaseUrl);

  // Add transformation parameters
  if (options.width && options.width > 0) {
    params.set('w', Math.round(options.width).toString());
  }

  if (options.height && options.height > 0) {
    params.set('h', Math.round(options.height).toString());
  }

  if (options.format) {
    params.set('fm', options.format);
  }

  if (options.quality && options.quality > 0 && options.quality <= 100) {
    params.set('q', Math.round(options.quality).toString());
  }

  if (options.fit) {
    params.set('fit', options.fit);
  }

  if (options.position) {
    params.set('position', options.position);
  }

  return `/.netlify/images?${params.toString()}`;
}

/**
 * Generate responsive srcset string for multiple image sizes
 *
 * @param firebaseUrl - Full Firebase Storage URL
 * @param widths - Array of widths to generate
 * @param options - Shared image transformation options (format, quality, etc.)
 * @returns srcset string ready for img element
 *
 * @example
 * ```ts
 * const srcset = generateSrcset(url, [400, 800, 1600], { format: 'webp' });
 * // Returns: "/.netlify/images?url=...&w=400&fm=webp 400w, ..."
 * ```
 */
export function generateSrcset(
  firebaseUrl: string,
  widths: number[] = [400, 800, 1600],
  options: Omit<NetlifyImageOptions, 'width'> = {},
): string {
  return widths
    .map((width) => {
      const url = netlifyImage(firebaseUrl, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}
