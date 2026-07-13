/**
 * Rewrite wiki links in the content to point to the correct location. This happens after
 * the content has been rendered to HTML from markdown, and these links were not rewritten.
 *
 * Examples:
 *
 * [Third Orleans / Kolmas Orleans](Kolmas Orleans)
 * -> <a href="https://example.com/sites/test-site/kolmas-orleans">Third Orleans / Kolmas Orleans</a>
 *
 * [Vampyyrien vankina]
 * -> <a href="https://example.com/sites/test-site/vampyyrien-vankina">Vampyyrien vankina</a>
 *
 * [Vampyyrien vankina](Eräs toinen saitti/Vampyyrien vankina)
 * -> <a href="https://example.com/sites/test-site/eras-toinen-saitti/vampyyrien-vankina">Vampyyrien vankina</a>
 *
 * [Vampyyrien vankina / Eräs toinen saitti]
 * -> <a href="https://example.com/sites/test-site/vampyyrien-vankina-eras-toinen-saitti">Vampyyrien vankina / Eräs toinen saitti</a>
 *
 * @param content
 * @param options
 */
export function rewriteWikiLinks(
  content: string,
  currentSite: string,
  baseUrl: string,
) {
  if (!currentSite || !baseUrl) {
    throw new Error('currentSite and baseUrl are required');
  }

  // Match all []() links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const matches = content.matchAll(linkRegex);

  let result = content;
  for (const match of matches) {
    const fullMatch = match[0];
    const linkText = match[1];
    const linkTarget = match[2];

    const newLink = rewriteUrl(linkTarget, currentSite, baseUrl);
    result = result.replace(fullMatch, `<a href="${newLink}">${linkText}</a>`);
  }

  // match links without ()
  const noParenthesesRegex = /\[([^\]]+)\]/g;
  const noParenthesesMatches = content.matchAll(noParenthesesRegex);
  for (const match of noParenthesesMatches) {
    const fullMatch = match[0];
    const linkText = match[1];

    const newLink = rewriteUrl(linkText, currentSite, baseUrl);
    result = result.replace(fullMatch, `<a href="${newLink}">${linkText}</a>`);
  }

  return result;
}

function toDashCase(text: string) {
  return text.toLowerCase().trim().replace(/ /g, '-');
}

function rewriteUrl(linkTarget: string, currentSite: string, baseUrl: string) {
  //if the linkTarget contains a protocol, return it as is
  if (linkTarget.match(/^https?:\/\//)) {
    return linkTarget;
  }

  //if the linkTarget has a /, it's a link to another site, otherwise it's a
  // link to the current site
  // logDebug('Rewriting link', { linkTarget, currentSite, baseUrl });
  if (linkTarget.includes('/')) {
    const [site, path] = linkTarget.split('/');
    return `${baseUrl}/sites/${toDashCase(site)}/${toDashCase(path)}`;
  }

  return `${baseUrl}/sites/${currentSite}/${toDashCase(linkTarget)}`;
}
