import { pageFrom } from 'src/schemas/PageSchema';
import { expect, test } from 'vitest';

test('pageFrom parses a page with minimal data', () => {
  const data = {
    name: 'a page',
    key: 'a',
    siteKey: 'site-a',
  };
  const page = pageFrom(data);
  expect(page.flowTime).toBe(0);
  expect(page.key).toBe('a');
  expect(page.siteKey).toBe('site-a');
});

test('pageFrom overrides key and siteKey', () => {
  const data = {
    name: 'a page',
    key: 'a',
    siteKey: 'site-a',
  };
  const page = pageFrom(data, 'b', 'site-b');
  expect(page.flowTime).toBe(0);
  expect(page.key).toBe('b');
  expect(page.siteKey).toBe('site-b');
});

test('pageFrom parses a page with markdownContent', () => {
  const data = {
    name: 'a page',
    markdownContent: '# Hello World',
  };
  const page = pageFrom(data, 'a', 'site-a');
  expect(page.markdownContent).toBe('# Hello World');
});
