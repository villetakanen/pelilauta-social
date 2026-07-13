import type { Site } from 'src/schemas/SiteSchema';

/**
 * Takes in rendered HTML and rewrites asset wikimarkup to assets to point to the correct site.
 *
 * Examples:
 * attach:image.jpg
 * -> <img src=`${[site.assets asset with the name image.jpg].downloadURL}` />
 * -> <a href=`${[origin]}/sites/${[site.name]}/add/asset?name=image.jpg`>Attach:image.jpg</a>
 *
 * @param htmlString
 * @param site
 */
export function renderAssetMarkup(
  htmlString: string,
  site: Site,
  origin: string,
) {
  if (!site || !origin) {
    throw new Error('site and origin are required');
  }

  if (!site.assets) {
    // No assets to replace, return the original string
    return htmlString;
  }

  // Match all attach: links, with line end of whitespace, end of string, or '<' (as in tag), case insensitive
  const linkRegex = /attach:([^\s<]+)(?=\s|<|$)/gi;
  const matches = htmlString.matchAll(linkRegex);

  let result = htmlString;
  for (const match of matches) {
    const fullMatch = match[0];
    const assetName = match[1];
    //logDebug('Found asset link', assetName);

    const asset = site.assets.find((asset) => asset.name === assetName);
    if (!asset) {
      // Asset not found, add link to upload asset
      result = result.replace(
        fullMatch,
        `<a href="${origin}/sites/${site.key}/add/asset?name=${assetName}">${fullMatch}</a>`,
      );
      continue;
    }

    if (asset.mimetype?.startsWith('image/')) {
      const newLink = `${asset.url}`;
      result = result.replace(fullMatch, `<img src="${newLink}" />`);
    } else {
      const newLink = `${asset.url}`;
      result = result.replace(
        fullMatch,
        `<a href="${newLink}">${asset.name}</a>`,
      );
    }
  }

  return result;
}
