import type { Site } from 'src/schemas/SiteSchema';
import { expect, test } from 'vitest';
import { getMarkedInstance } from '../../src/utils/shared/getMarked';

const mockSite: Site = {
  key: 'test-site',
  name: 'Test Site',
  assets: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  description: 'A test site for unit testing',
  flowTime: 0,
  owners: [],
  hidden: false,
  sortOrder: 'createdAt',
  system: 'homebrew',
  license: 'homebrew',
  customPageKeys: false,
  usePlainTextURLs: false,
  useSidebar: false,
};

test('getMarked with site returns a function that can render in-site links', async () => {
  const marked = getMarkedInstance('https://example.com', {
    site: mockSite,
  });

  const result = marked.parse('[Test Link](test-link)');
  expect(result).toContain(
    '<a href="https://example.com/sites/test-site/test-link">Test Link</a>',
  );
});

test('getMarked with site returns a function that can render external links', async () => {
  const marked = getMarkedInstance('https://example.com', {
    site: mockSite,
  });

  const result = marked.parse('[External Link](https://external.com)');
  expect(result).toContain('<a href="https://external.com">External Link</a>');
});

test('getMarked with site returns a function that can render wikilink shortcuts', async () => {
  const marked = getMarkedInstance('https://example.com', {
    site: mockSite,
  });

  const result = marked.parse('[[Test Link | obsidian style link]]');
  expect(result).toContain(
    '<a href="https://example.com/sites/test-site/test-link">obsidian style link</a>',
  );
});

test('getMarked should not convert a tag that is not preceded by whitespace', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const markdown = 'Anexample@tag';
  const result = await marked.parse(markdown);
  expect(result).toBe('<p>Anexample@tag</p>\n');
});

// Defect: renderer.link rendered `token.text` (the raw, unparsed label) so
// notation inside a standard [text](url) link never converted. It now
// parses `token.tokens`, keeping the href rewriting and title unchanged.

test('a standard link converts Dice notation in its text and keeps its rewritten href', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const result = await marked.parse('[dice:6:2](test-link)');
  expect(result).toContain(
    '<a href="https://example.com/sites/test-site/test-link">' +
      '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>' +
      '</a>',
  );
});

test('a standard link keeps its title attribute after the defect fix', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const result = await marked.parse('[Test Link](test-link "A title")');
  expect(result).toContain(
    '<a href="https://example.com/sites/test-site/test-link" title="A title">Test Link</a>',
  );
});

// specs/pelilauta/wiki-dice-notation/spec.md: "Given standard, shortcut and
// Obsidian link text containing dice:6:2 ... the link text contains a
// result span and each link destination resolves as it does without Dice
// notation."

const diceResultSpan =
  '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>';

test('a wikilink shortcut converts dice notation in its own text', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const result = await marked.parse('[dice:6:2]');
  expect(result).toContain(
    `<a href="https://example.com/sites/test-site/dice:6:2">${diceResultSpan}</a>`,
  );
});

test('an aliased Obsidian wikilink converts its display text, and its own destination is unaffected', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const result = await marked.parse('[[Test Link|dice:6:2]]');
  expect(result).toContain(
    `<a href="https://example.com/sites/test-site/test-link">${diceResultSpan}</a>`,
  );
});

test('an unaliased Obsidian wikilink converts its own text, and its href resolves as it does without Dice notation', async () => {
  const marked = getMarkedInstance('https://example.com', { site: mockSite });
  const result = await marked.parse('[[dice:6]]');
  expect(result).toContain(
    '<a href="https://example.com/sites/test-site/dice:6">' +
      '<span class="dice" role="img" data-sides="6" data-value="6" data-kind="die" data-length="1" aria-label="[6]">6</span>' +
      '</a>',
  );
});
