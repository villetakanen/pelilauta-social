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
