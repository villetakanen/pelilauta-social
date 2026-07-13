import type { MarkedExtension } from 'marked';

/**
 * Creates a marked extension to handle @profile tags.
 *
 * Supports:
 * - @profileName -> <a href="/profiles/profilename">@profileName</a>
 *
 * @param baseUrl The base URL of the application (e.g., 'https://example.com').
 * @returns A configured `MarkedExtension` object for profile tags.
 */
export function createProfileTagExtension(baseUrl: string): MarkedExtension {
  if (!baseUrl) {
    throw new Error('baseUrl is required for profile tag extension.');
  }

  return {
    async: false,
    // Use preprocessor to handle profile tags before other processing
    hooks: {
      preprocess(markdown: string): string {
        // Match profile tags that are:
        // 1. At the start of the string, OR
        // 2. Preceded by whitespace
        // 3. Not part of an email (not followed by .domain)
        const profileTagRegex =
          /(^|\s)@([a-zA-Z0-9\u00C0-\u017F_-]+)(?!\.[a-zA-Z]{2,})/g;

        return markdown.replace(profileTagRegex, (_match, prefix, username) => {
          const href = `${baseUrl}/profiles/${encodeURIComponent(username.toLowerCase())}`;
          return `${prefix}<a href="${href}">@${username}</a>`;
        });
      },
    },
  };
}
