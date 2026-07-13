import { expect, test } from 'vitest';
import { toFid } from '../../src/utils/toFid';

test('toFid converts string with whitespaces to federated id', () => {
  expect(toFid('  12 3  ')).toBe('@123@pelilauta.social');
});
