/**
 * cover-placeholder.ts — the system cover artwork.
 *
 * One landscape, used for two purposes: the cover a book specimen shows when it
 * needs a real image, and the image CnCard falls back to when a supplied cover
 * cannot load. Both read this module, so the artwork cannot drift between the
 * documented state and the shipped one.
 *
 * It lives in the package rather than an application's `public/` directory
 * because a design-system component cannot depend on what a host application
 * happens to serve. A data URI also cannot itself fail to load, which is what
 * makes it safe as an error fallback: swapping to it can never re-enter the
 * error path.
 *
 * Spec: specs/design-system/components/cn-card/spec.md
 */

/** 16:9, so it drops into a cover region without changing its geometry. */
export const COVER_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#102d3b"/>
      <stop offset=".48" stop-color="#487c76"/>
      <stop offset="1" stop-color="#b7c88b"/>
    </linearGradient>
    <linearGradient id="mist" x1="0" y1="1" x2="1" y2="0">
      <stop stop-color="#d9d6b4" stop-opacity=".08"/>
      <stop offset=".55" stop-color="#e9e0bd" stop-opacity=".5"/>
      <stop offset="1" stop-color="#fff2c5" stop-opacity=".12"/>
    </linearGradient>
    <filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence baseFrequency=".65" numOctaves="4" seed="17" type="fractalNoise"/>
      <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .22 0"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#sky)"/>
  <path d="M0 390 190 205l95 94 116-151 105 135 88-79 206 186v60H0Z" fill="#172d2b" opacity=".86"/>
  <path d="M0 370c155-86 263-40 388-91 125-52 252-82 412 6v165H0Z" fill="url(#mist)"/>
  <circle cx="650" cy="100" r="48" fill="#f6e4a4" opacity=".86"/>
  <rect width="800" height="450" filter="url(#grain)" opacity=".55"/>
</svg>`;

/**
 * Encoded rather than hand-escaped: the artwork carries `#` in every fill, and
 * an unescaped `#` truncates a data URI at the first colour.
 */
export const COVER_PLACEHOLDER_URI = `data:image/svg+xml,${encodeURIComponent(
  COVER_PLACEHOLDER_SVG,
)}`;
