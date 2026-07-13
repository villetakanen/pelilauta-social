/**
 * Takes in markdown and rewrites tag markup to links pointing to
 * the tag's page
 *
 * Examples:
 * #tag -> [#tag](https://example.com/tags/tag)
 * #D&D -> [#D&D](https://example.com/tags/d%26d)
 *
 * Notes:
 * - All urls are lowercase, so tags are also lowercased
 * - Tags are url encoded, allowed characters are a-z, A-Z, 0-9, -, &, +, _, ä, ö, and å
 *
 * @param htmlString A string of HTML to replace tag markup in
 */

export const renderTags = (markdown: string, origin: string) => {
  if (!origin) {
    throw new Error('origin is required');
  }

  // Match all #tag links, with line end of whitespace, end of string, or '<' (as in tag), case insensitive
  const tagRegex = /#([a-zA-Z0-9&+_-äöåÄÖÅ]+)(?=\s|<|:|:n|$)/gi;
  const matches = markdown.matchAll(tagRegex);

  let result = markdown;
  for (const match of matches) {
    const fullMatch = match[0];
    const tagName = match[1];

    const newLink = `${origin}/tags/${encodeURIComponent(tagName.toLowerCase())}`;
    result = result.replaceAll(fullMatch, `[${fullMatch}](${newLink})`);
  }

  return result;
};
