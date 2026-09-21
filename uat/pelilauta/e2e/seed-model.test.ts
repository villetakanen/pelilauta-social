import { describe, expect, it } from 'vitest';
import {
  buildSeedModel,
  type PlaceholderMap,
  type RawSeed,
} from './seed-model';

const ctx: PlaceholderMap = {
  uidByPlaceholder: {
    '@existingUser': 'uid-existing',
    '@newUser': 'uid-new',
    '@adminUser': 'uid-admin',
  },
  assetUrlMap: new Map(),
  now: 1_700_000_000_000,
};

/**
 * A minimal, valid seed: one channel with one thread and its one reply, one
 * visible site with one untagged page, and one hidden site with one untagged
 * page. Tests override just the piece under test.
 */
function baseRawSeed(): RawSeed {
  return {
    account: {
      '@existingUser': { uid: '@existingUser', eulaAccepted: true },
    },
    profiles: {
      '@existingUser': { key: '@existingUser', nick: 'Koekäyttäjä' },
    },
    sites: {
      'visible-site': {
        key: 'visible-site',
        name: 'Visible Site',
        owners: ['@existingUser'],
        hidden: false,
      },
      'hidden-site': {
        key: 'hidden-site',
        name: 'Hidden Site',
        owners: ['@existingUser'],
        hidden: true,
      },
    },
    pages: {
      'visible-site/front-page': {
        key: 'front-page',
        siteKey: 'visible-site',
        name: 'Front Page',
        owners: ['@existingUser'],
      },
      'hidden-site/front-page': {
        key: 'front-page',
        siteKey: 'hidden-site',
        name: 'Front Page',
        owners: ['@existingUser'],
      },
    },
    threads: {
      'thread-one': {
        title: 'Thread One',
        channel: 'yleinen',
        owners: ['@existingUser'],
        replyCount: 1,
        public: true,
      },
    },
    replies: {
      'thread-one/vastaus-1': {
        threadKey: 'thread-one',
        owners: ['@existingUser'],
        markdownContent: 'Vastaus.',
      },
    },
    meta: {
      pelilauta: { admins: ['@adminUser'] },
      threads: {
        topics: [
          {
            slug: 'yleinen',
            name: 'Yleinen',
            description: 'Yleinen keskustelu',
            threadCount: 1,
          },
        ],
      },
    },
  };
}

describe('buildSeedModel', () => {
  it('accepts a self-consistent seed', () => {
    const model = buildSeedModel(baseRawSeed(), ctx);
    expect(Object.keys(model.threads)).toEqual(['thread-one']);
    expect(Object.keys(model.replies)).toEqual(['thread-one/vastaus-1']);
  });

  it('rejects a thread whose replyCount does not match the seeded replies', () => {
    const raw = baseRawSeed();
    raw.threads['thread-one'].replyCount = 2;
    expect(() => buildSeedModel(raw, ctx)).toThrow(/thread-one/i);
    expect(() => buildSeedModel(raw, ctx)).toThrow(/replyCount/);
  });

  it('rejects a channel whose threadCount does not match the seeded threads', () => {
    const raw = baseRawSeed();
    raw.meta.threads.topics[0].threadCount = 2;
    expect(() => buildSeedModel(raw, ctx)).toThrow(/yleinen/);
    expect(() => buildSeedModel(raw, ctx)).toThrow(/threadCount/);
  });

  it('rejects a reply whose compound key names an unknown thread', () => {
    const raw = baseRawSeed();
    raw.replies['ghost-thread/vastaus-1'] = {
      threadKey: 'ghost-thread',
      owners: ['@existingUser'],
      markdownContent: 'Orpo vastaus.',
    };
    // Also fix replyCount so the missing-parent check is what fails first.
    raw.threads['thread-one'].replyCount = 1;
    expect(() => buildSeedModel(raw, ctx)).toThrow(/ghost-thread/);
  });

  it('rejects a page whose compound key names an unknown site', () => {
    const raw = baseRawSeed();
    raw.pages['ghost-site/front-page'] = {
      key: 'front-page',
      siteKey: 'ghost-site',
      name: 'Front Page',
      owners: ['@existingUser'],
    };
    expect(() => buildSeedModel(raw, ctx)).toThrow(/ghost-site/);
  });

  it('rejects a compound key that does not split into exactly two parts', () => {
    const raw = baseRawSeed();
    raw.pages['too/many/parts'] = {
      key: 'parts',
      siteKey: 'visible-site',
      name: 'Parts',
      owners: ['@existingUser'],
    };
    expect(() => buildSeedModel(raw, ctx)).toThrow(/too\/many\/parts/);
  });

  it('derives a tag entry for a tagged public thread, keyed and normalized to lowercase', () => {
    const raw = baseRawSeed();
    raw.threads['thread-one'].tags = ['DnD', 'Aloittelijoille'];
    const model = buildSeedModel(raw, ctx);
    expect(model.tags['thread-one']).toBeDefined();
    expect(model.tags['thread-one'].type).toBe('thread');
    expect(model.tags['thread-one'].key).toBe('thread-one');
    expect(model.tags['thread-one'].tags).toEqual(['dnd', 'aloittelijoille']);
  });

  it('does not derive a tag entry for an untagged or a non-public thread', () => {
    const raw = baseRawSeed();
    // untagged, as in baseRawSeed()
    expect(buildSeedModel(raw, ctx).tags['thread-one']).toBeUndefined();

    raw.threads['thread-one'].tags = ['dnd'];
    raw.threads['thread-one'].public = false;
    expect(buildSeedModel(raw, ctx).tags['thread-one']).toBeUndefined();
  });

  it('derives a tag entry for a tagged page on a visible site, with the page-key doc id and the siteKey/pageKey Tag.key', () => {
    const raw = baseRawSeed();
    raw.pages['visible-site/front-page'].tags = ['DND'];
    const model = buildSeedModel(raw, ctx);
    expect(model.tags['front-page']).toBeDefined();
    expect(model.tags['front-page'].type).toBe('page');
    expect(model.tags['front-page'].key).toBe('visible-site/front-page');
    expect(model.tags['front-page'].tags).toEqual(['dnd']);
  });

  it('excludes a tagged page belonging to a hidden site from the tag index', () => {
    const raw = baseRawSeed();
    raw.pages['hidden-site/front-page'].tags = ['dnd'];
    const model = buildSeedModel(raw, ctx);
    expect(model.tags['front-page']).toBeUndefined();
  });

  it('rejects an unresolvable placeholder', () => {
    const raw = baseRawSeed();
    raw.threads['thread-one'].author = '@unknownUser';
    expect(() => buildSeedModel(raw, ctx)).toThrow(/@unknownUser/);
  });

  it('keeps a fediverse handle, which is content rather than a placeholder', () => {
    const raw = baseRawSeed();
    raw.profiles['@existingUser'].username = '@koekayttaja@pelilauta.social';
    const model = buildSeedModel(raw, ctx);
    expect(Object.values(model.profiles)[0].username).toBe(
      '@koekayttaja@pelilauta.social',
    );
  });
});
