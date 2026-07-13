/**
 * Replaces a String with a skald uri compatible slug
 * @param {string} s a String to be converted
 */
export function toMekanismiURI(s: string) {
  if (s === null) return '';
  const re = /[^a-öA-Ö0-9]/gmu;
  let r = s.replace(re, '-');
  while (r.includes('--')) {
    r = r.split('--').join('-');
  }

  if (r.startsWith('-')) r = r.slice(1);
  if (r.endsWith('-')) r = r.slice(0, -1);

  return r.toLowerCase();
}
