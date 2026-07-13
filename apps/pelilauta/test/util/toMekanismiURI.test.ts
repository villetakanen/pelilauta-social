import { expect, test } from 'vitest';
import { toMekanismiURI } from '../../src/utils/mekanismiUtils';

test('toMekanismiURI converts string with whitespaces to mekanismi uri', () => {
  expect(toMekanismiURI('  12 3  ')).toBe('12-3');
});

test('toMekanismiURI converts string with special characters to mekanismi uri', () => {
  expect(toMekanismiURI('  12 3  !@#$%^&*()_+  ')).toBe('12-3-^-_');
});

test('toMekanismiURI converts string with unlauted characters to mekanismi uri', () => {
  expect(toMekanismiURI('  12 3  åäö  ')).toBe('12-3-åäö');
});
