import { expect, test } from 'vitest';
import { rewriteWikiLinks } from '../../../src/utils/server/contentHelpers';

test('wikilinks are converted to markdown links', () => {
  const content = '[Third Orleans / Kolmas Orleans](Kolmas Orleans)';
  const currentSite = 'test-site';
  const baseUrl = 'https://example.com';
  const expected =
    '<a href="https://example.com/sites/test-site/kolmas-orleans">Third Orleans / Kolmas Orleans</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('wikilinks without () are converted to markdown links', () => {
  const content = '[Vampyyrien vankina]';
  const currentSite = 'test-site';
  const baseUrl = 'https://example.com';
  const expected =
    '<a href="https://example.com/sites/test-site/vampyyrien-vankina">Vampyyrien vankina</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('wikilinks with () and / are converted to markdown links', () => {
  const content = '[Vampyyrien vankina](Eräs toinen saitti/Vampyyrien vankina)';
  const currentSite = 'test-site';
  const baseUrl = 'https://example.com';
  const expected =
    '<a href="https://example.com/sites/eräs-toinen-saitti/vampyyrien-vankina">Vampyyrien vankina</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('wikilinks with / are converted to markdown links', () => {
  const content = '[Vampyyrien vankina / Eräs toinen saitti]';
  const currentSite = 'test-site';
  const baseUrl = 'https://example.com';
  const expected =
    '<a href="https://example.com/sites/vampyyrien-vankina/eräs-toinen-saitti">Vampyyrien vankina / Eräs toinen saitti</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('https links are not converted to markdown links', () => {
  const content = '[https://example.com]';
  const currentSite = 'test-site';
  const baseUrl = 'https://example.com';
  const expected = '<a href="https://example.com">https://example.com</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('in-site links are converted, with site path included', () => {
  const content = '[Peli I](pelii)';
  const currentSite = 'rotriv';
  const baseUrl = 'https://example.com';
  const expected =
    '<a href="https://example.com/sites/rotriv/pelii">Peli I</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
test('outside links are not converted to markdown links', () => {
  const content = '[Peli I](https://example.com)';
  const currentSite = 'rotriv';
  const baseUrl = 'https://another.com';
  const expected = '<a href="https://example.com">Peli I</a>';
  expect(rewriteWikiLinks(content, currentSite, baseUrl)).toBe(expected);
});
