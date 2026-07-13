import { expect, test } from 'vitest';
import { extractTags, toDisplayString } from '../../src/utils/contentHelpers';

test('toDisplayString returns N/A if date is undefined', () => {
  expect(toDisplayString(undefined)).toBe('N/A');
});

test('toDisplayString returns date as string', () => {
  const date = new Date('2021-12-24');
  expect(toDisplayString(date)).toBe('2021-12-24');
});

test('extractTags returns empty array if no tags', () => {
  expect(extractTags('')).toEqual([]);
});

test('extractTags returns tags from content', () => {
  expect(extractTags('#tag1 #täg2')).toEqual(['tag1', 'täg2']);
});

test('extractTags removes duplicates', () => {
  expect(extractTags('#tag1 #tag1')).toEqual(['tag1']);
});
