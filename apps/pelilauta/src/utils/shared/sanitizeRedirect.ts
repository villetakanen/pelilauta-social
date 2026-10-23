const REDIRECT_ORIGIN = 'https://pelilauta.invalid';
const CONTROL_CHARACTERS = /\p{Cc}|%(?:0[0-9a-f]|1[0-9a-f]|7f)/iu;

export function sanitizeRedirect(candidate: string | null | undefined): string {
  if (
    !candidate?.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.startsWith('/\\') ||
    CONTROL_CHARACTERS.test(candidate)
  ) {
    return '/';
  }

  try {
    const url = new URL(candidate, REDIRECT_ORIGIN);
    const pathname = new URL(decodeURIComponent(url.pathname), REDIRECT_ORIGIN);
    if (
      url.origin !== REDIRECT_ORIGIN ||
      url.pathname.startsWith('//') ||
      pathname.origin !== REDIRECT_ORIGIN ||
      /^\/login(?:\/|$)/i.test(pathname.pathname)
    ) {
      return '/';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
