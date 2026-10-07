import { describe, expect, test } from 'vitest';
import { renderMarkdown } from './renderMarkdown';

const origin = 'https://example.com';
const site = {
  key: 'my-site',
  assets: [
    {
      url: 'https://cdn/map.png',
      name: 'map.png',
      description: '',
      license: '0',
      mimetype: 'image/png',
    },
    {
      url: 'https://cdn/rules.pdf',
      name: 'rules.pdf',
      description: '',
      license: '0',
      mimetype: 'application/pdf',
    },
  ],
};

describe('options and defaults', () => {
  test('single newlines break lines', () => {
    expect(renderMarkdown('a\nb', { origin })).toContain('a<br />b');
  });

  test('hashtags default to literal', () => {
    expect(renderMarkdown('hello #tag', { origin })).toBe(
      '<p>hello #tag</p>\n',
    );
  });

  test('footnotes default to literal', () => {
    const html = renderMarkdown('a[^1]\n\n[^1]: note', { origin, site });
    expect(html).toContain('a[^1]');
    expect(html).toContain('[^1]: note');
    expect(html).not.toContain('<a');
    expect(html).not.toContain('footnotes');
  });

  test('profile references and Dice are always on', () => {
    const html = renderMarkdown('@Ville rolls dice:6:2', { origin });
    expect(html).toContain(
      '<a href="https://example.com/profiles/ville">@Ville</a>',
    );
    expect(html).toContain('data-kind="result"');
  });
});

describe('literal without site context', () => {
  test('wiki shortcuts and attachments stay literal', () => {
    const html = renderMarkdown('[Page Name] [[Other]] attach:map.png', {
      origin,
    });
    expect(html).toBe('<p>[Page Name] [[Other]] attach:map.png</p>\n');
  });

  test('ordinary destinations are unchanged', () => {
    expect(renderMarkdown('[a](Some Page)', { origin })).toContain(
      '[a](Some Page)',
    );
    expect(renderMarkdown('[a](https://x.fi/y)', { origin })).toContain(
      'href="https://x.fi/y"',
    );
  });

  test('no site leaks between sequential renders', () => {
    const withSite = renderMarkdown('attach:map.png [Page]', { origin, site });
    expect(withSite).toContain('<img');
    expect(withSite).toContain('/sites/my-site/page');
    const without = renderMarkdown('attach:map.png [Page]', { origin });
    expect(without).toBe('<p>attach:map.png [Page]</p>\n');
    const other = renderMarkdown('[Page]', { origin, site: { key: 'other' } });
    expect(other).toContain('/sites/other/page');
  });
});

describe('wiki links', () => {
  test('shortcut, obsidian, aliased and cross-site links', () => {
    const html = renderMarkdown(
      '[Page Name] [[Other Page]] [[Foo/Bar Baz|label]]',
      { origin, site },
    );
    expect(html).toContain(
      '<a href="https://example.com/sites/my-site/page-name">Page Name</a>',
    );
    expect(html).toContain(
      'href="https://example.com/sites/my-site/other-page"',
    );
    expect(html).toContain(
      '<a href="https://example.com/sites/foo/bar-baz">label</a>',
    );
  });

  test('a defined reference precedes a wiki shortcut', () => {
    const html = renderMarkdown(
      '[Page] and [Other]\n\n[page]: https://ref.example/x',
      { origin, site },
    );
    expect(html).toContain('<a href="https://ref.example/x">Page</a>');
    expect(html).toContain('/sites/my-site/other');
  });

  test('explicit relative destinations and fragments are preserved', () => {
    const html = renderMarkdown(
      '[a](/x) [b](./y) [c](../z) [d](#frag) [e](?q=1) [f](mailto:a@b.fi) [g](Foo/Bar)',
      { origin, site },
    );
    for (const href of [
      '/x',
      './y',
      '../z',
      '#frag',
      '?q=1',
      'mailto:a@b.fi',
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('href="https://example.com/sites/foo/bar"');
  });

  test('title is escaped', () => {
    const html = renderMarkdown('[a](/x "a \\"b\\" <i>")', { origin, site });
    expect(html).not.toContain('<i>');
  });

  test('Finnish characters survive in labels', () => {
    const html = renderMarkdown('[[Ääkköset|Älä äläkä]]', { origin, site });
    expect(html).toContain('Älä äläkä');
    expect(html).toContain('/sites/my-site/%C3%A4%C3%A4kk%C3%B6set');
  });

  test('wiki notation stays literal in code', () => {
    const html = renderMarkdown('`[Page]`\n\n```\n[Page] attach:map.png\n```', {
      origin,
      site,
    });
    expect(html).not.toContain('<a');
    expect(html).not.toContain('<img');
  });
});

describe('attachments', () => {
  test('image uses asset URL with filename alt', () => {
    expect(renderMarkdown('attach:map.png', { origin, site })).toContain(
      '<img src="https://cdn/map.png" alt="map.png" />',
    );
  });

  test('file links with filename text', () => {
    expect(renderMarkdown('attach:rules.pdf', { origin, site })).toContain(
      '<a href="https://cdn/rules.pdf">rules.pdf</a>',
    );
  });

  test('missing file links the notation to the upload page', () => {
    expect(renderMarkdown('attach:kartta ä.png', { origin, site })).toContain(
      '<a href="https://example.com/sites/my-site/add/asset?name=kartta">attach:kartta</a>',
    );
    expect(renderMarkdown('attach:Älä.png', { origin, site })).toContain(
      'href="https://example.com/sites/my-site/add/asset?name=%C3%84l%C3%A4.png">attach:Älä.png</a>',
    );
  });

  test('an absent attachment list is empty', () => {
    expect(
      renderMarkdown('attach:map.png', { origin, site: { key: 'my-site' } }),
    ).toContain('add/asset?name=map.png');
  });

  test('excluded from code, links and image destinations', () => {
    const html = renderMarkdown(
      '`attach:map.png` [attach:map.png](https://x.fi) ![a](attach:map.png)',
      { origin, site },
    );
    expect(html).not.toContain('cdn/map.png');
    expect(html).not.toContain('add/asset');
  });
});

describe('bare-URL marker', () => {
  test('autolinks and explicit links with equal text carry url', () => {
    const html = renderMarkdown(
      'https://a.fi/x?a=1&b=2 <https://b.fi> [https://c.fi](https://c.fi) www.d.fi',
      { origin },
    );
    expect(html.match(/class="url"/g)).toHaveLength(4);
    expect(html).toContain('href="https://c.fi"');
  });

  test('descriptive links carry no marker, with or without site', () => {
    expect(renderMarkdown('[click](https://a.fi)', { origin })).not.toContain(
      'class=',
    );
    expect(
      renderMarkdown('[click](https://a.fi)', { origin, site }),
    ).not.toContain('class=');
    expect(renderMarkdown('https://a.fi', { origin, site })).toContain(
      'class="url"',
    );
  });
});

describe('hashtags and profiles', () => {
  test('hashtags link when enabled', () => {
    const html = renderMarkdown('#D&D (#Äiti) "#tag-1" a#no', {
      origin,
      hashtags: true,
    });
    expect(html).toContain(
      '<a href="https://example.com/tags/d%26d">#D&amp;D</a>',
    );
    expect(html).toContain('/tags/%C3%A4iti">#Äiti</a>');
    expect(html).toContain('/tags/tag-1">#tag-1</a>');
    expect(html).not.toContain('/tags/no');
  });

  test('hashtags start a line and stop at punctuation', () => {
    const html = renderMarkdown('first\n#tag.', { origin, hashtags: true });
    expect(html).toContain(
      '<br /><a href="https://example.com/tags/tag">#tag</a>.',
    );
  });

  test('hashtags skip code, link labels and destinations', () => {
    const html = renderMarkdown('`#a` [#b](https://x.fi/#c) https://x.fi/#d', {
      origin,
      hashtags: true,
    });
    expect(html).not.toContain('/tags/');
  });

  test('headings are not hashtags', () => {
    expect(renderMarkdown('# Title', { origin, hashtags: true })).toBe(
      '<h1>Title</h1>\n',
    );
  });

  test('profile rules', () => {
    const ok = renderMarkdown('hi @Äiti-1, and @x.', { origin });
    expect(ok).toContain('/profiles/%C3%A4iti-1">@Äiti-1</a>');
    expect(ok).toContain('/profiles/x">@x</a>.');
    expect(renderMarkdown('@start', { origin })).toContain(
      '/profiles/start">@start</a>',
    );
    expect(
      renderMarkdown('mail me@x.com or @user.name', { origin }),
    ).not.toContain('/profiles/');
    expect(renderMarkdown('`@a` [@b](https://x.fi)', { origin })).not.toContain(
      '/profiles/',
    );
  });
});

describe('footnotes', () => {
  const src = 'text[^a] again[^a]\n\n[^a]: the note';

  test('emits the namespaced markup contract', () => {
    const html = renderMarkdown(src, {
      origin,
      footnotes: true,
      namespace: 'p1',
    });
    expect(html).toContain('id="fnref-p1-1-1"');
    expect(html).toContain('id="fnref-p1-1-2"');
    expect(html).toContain('href="#fn-p1-1"');
    expect(html).toContain('<li id="fn-p1-1">');
    expect(html).toContain('href="#fnref-p1-1-2"');
    expect(html).toContain('<section class="footnotes">');
    expect(html).toContain('aria-label=');
  });

  test('distinct namespaces give distinct identifiers', () => {
    const a = renderMarkdown(src, { origin, footnotes: true, namespace: 'a' });
    const b = renderMarkdown(src, { origin, footnotes: true, namespace: 'b' });
    expect(a).not.toContain('-b-');
    expect(a).toContain('fn-a-1');
    expect(b).toContain('fn-b-1');
    expect(b).not.toContain('fn-a-');
  });

  test('requires a valid namespace', () => {
    expect(() => renderMarkdown(src, { origin, footnotes: true })).toThrow();
    expect(() =>
      renderMarkdown(src, { origin, footnotes: true, namespace: 'a b' }),
    ).toThrow();
  });
});

describe('Dice, tasks and sanitization through the entry', () => {
  test('Dice markup survives sanitization', () => {
    expect(renderMarkdown('target:6:2', { origin })).toContain(
      '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="target" data-length="1" aria-label="[d6, 2+]">2<span class="dice-plus">+</span></span>',
    );
  });

  test('task-list checkboxes stay disabled', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo', { origin, site });
    expect(html).toContain('<input type="checkbox" disabled checked />');
    expect(html.match(/disabled/g)).toHaveLength(2);
  });
});

describe('Dice in link text', () => {
  const linkSite = { key: 'my-site' };

  // Defect: renderer.link rendered `token.text` (the raw, unparsed label) so
  // notation inside a standard [text](url) link never converted. It now
  // parses `token.tokens`, keeping the href rewriting and title unchanged.

  test('a standard link converts Dice notation in its text and keeps its rewritten href', () => {
    const result = renderMarkdown('[dice:6:2](test-link)', {
      origin,
      site: linkSite,
    });
    expect(result).toContain(
      '<a href="https://example.com/sites/my-site/test-link">' +
        '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>' +
        '</a>',
    );
  });

  test('a standard link keeps its title attribute after the defect fix', () => {
    const result = renderMarkdown('[Test Link](test-link "A title")', {
      origin,
      site: linkSite,
    });
    expect(result).toContain(
      '<a href="https://example.com/sites/my-site/test-link" title="A title">Test Link</a>',
    );
  });

  // specs/pelilauta/wiki-dice-notation/spec.md: "Given standard, shortcut and
  // Obsidian link text containing dice:6:2 ... the link text contains a
  // result span and each link destination resolves as it does without Dice
  // notation."

  const diceResultSpan =
    '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>';

  test('a wikilink shortcut converts dice notation in its own text', () => {
    const result = renderMarkdown('[dice:6:2]', { origin, site: linkSite });
    expect(result).toContain(
      `<a href="https://example.com/sites/my-site/dice:6:2">${diceResultSpan}</a>`,
    );
  });

  test('an aliased Obsidian wikilink converts its display text, and its own destination is unaffected', () => {
    const result = renderMarkdown('[[Test Link|dice:6:2]]', {
      origin,
      site: linkSite,
    });
    expect(result).toContain(
      `<a href="https://example.com/sites/my-site/test-link">${diceResultSpan}</a>`,
    );
  });

  test('an unaliased Obsidian wikilink converts its own text, and its href resolves as it does without Dice notation', () => {
    const result = renderMarkdown('[[dice:6]]', { origin, site: linkSite });
    expect(result).toContain(
      '<a href="https://example.com/sites/my-site/dice:6">' +
        '<span class="dice" role="img" data-sides="6" data-value="6" data-kind="die" data-length="1" aria-label="[6]">6</span>' +
        '</a>',
    );
  });
});
