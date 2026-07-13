export function toDisplayString(
  date: Date | number | undefined,
  relative = false,
  locale = 'fi',
): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (relative) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = (d.getTime() - now.getTime()) / 1000;
    const diffInMinutes = diffInSeconds / 60;
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    // Only show relative time for the last 72 hours (3 days)
    if (Math.abs(diffInHours) > 72) {
      // Recursively call this (toDisplayString) with relative = false
      return toDisplayString(date, false, locale);
    }

    if (Math.abs(diffInSeconds) < 60)
      return rtf.format(Math.round(diffInSeconds), 'second');
    if (Math.abs(diffInMinutes) < 60)
      return rtf.format(Math.round(diffInMinutes), 'minute');
    if (Math.abs(diffInHours) < 24)
      return rtf.format(Math.round(diffInHours), 'hour');
    return rtf.format(Math.round(diffInDays), 'day');
  }
  return d.toISOString().substring(0, 10);
}
export function toTimeString(date: Date | number | undefined): string {
  if (!date) return 'N/A';
  // Take the iso format date and time, and add a space in between
  const isoString = new Date(date).toISOString();
  return `${isoString.substring(0, 10)} ${isoString.substring(11, 19)}`;
}

/**
 * Takes in a string of markdown content and extracts tags (#tag) from it.
 * @param content
 */
export function extractTags(content: string): string[] {
  const tags = content.match(/#[a-zA-Z0-9äöüÄÖÜ]+/g);
  // we want to only 1 tag per tag
  const raw = tags ? [...new Set(tags)] : [];
  return raw.map((tag) => tag.replace('#', ''));
}
