import { expect, test } from 'vitest';
import { renderTags } from '../../../src/utils/server/renderTags';

test('tags are converted to links', () => {
  const content = 'This is a #tag';
  const origin = 'https://example.com';
  const expected = 'This is a [#tag](https://example.com/tags/tag)';
  expect(renderTags(content, origin)).toBe(expected);
});
test('tags are converted to links with special characters', () => {
  const content = 'This is a #D&D';
  const origin = 'https://example.com';
  const expected = 'This is a [#D&D](https://example.com/tags/d%26d)';
  expect(renderTags(content, origin)).toBe(expected);
});
test('Complex string with tags, is converted correctly', () => {
  const content =
    '1. Pelissä käytetään #L&L:n sääntöjä, täydennettynä esimateriialeilla Petri Leinosen Eevenkodosta, ja #D&D PHB 2024:stä.';
  const origin = 'https://example.com';
  const expected =
    '1. Pelissä käytetään [#L&L](https://example.com/tags/l%26l):n sääntöjä, täydennettynä esimateriialeilla Petri Leinosen Eevenkodosta, ja [#D&D](https://example.com/tags/d%26d) PHB 2024:stä.';
  expect(renderTags(content, origin)).toBe(expected);
});
