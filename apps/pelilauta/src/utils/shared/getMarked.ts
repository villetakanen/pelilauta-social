import { Marked } from 'marked';
import type { Asset } from 'src/schemas/AssetSchema';
import { createAttachmentExtension } from './marked/createAttachmentExtension';
import { createDiceExtension } from './marked/createDiceExtension';
import {
  createFootnoteExtension,
  createLiteralFootnoteExtension,
} from './marked/createFootnoteExtension';
import { createHashtagExtension } from './marked/createHashtagExtension';
import { createLinkRenderer } from './marked/createLinkRenderer';
import { createProfileTagExtension } from './marked/createProfileTagExtension';
import {
  createWikilinkExtension,
  createWikiResolver,
} from './marked/createWikilinkExtension';

export type MarkedConfig = {
  origin: string;
  site?: { key: string; assets?: readonly Asset[] };
  footnotes: boolean;
  hashtags: boolean;
  namespace?: string;
};

/**
 * Private to renderMarkdown.ts. Returns a new, configured marked instance;
 * a fresh instance per render keeps site context from leaking between
 * renders. Extensions registered later run first.
 */
export function getMarkedInstance(config: MarkedConfig): Marked {
  const { origin, site } = config;
  const marked = new Marked({ gfm: true, breaks: true, pedantic: false });

  marked.use(
    createLinkRenderer(
      site
        ? createWikiResolver(origin, site.key).resolveDestination
        : undefined,
    ),
  );
  marked.use(createProfileTagExtension(origin));
  if (config.hashtags) marked.use(createHashtagExtension(origin));
  marked.use(createDiceExtension());

  if (site) {
    marked.use(createWikilinkExtension(origin, site.key));
    marked.use(createAttachmentExtension(origin, site.key, site.assets));
  }

  if (config.footnotes) {
    marked.use(createFootnoteExtension(config.namespace ?? ''));
  } else {
    marked.use(createLiteralFootnoteExtension());
  }

  return marked;
}
