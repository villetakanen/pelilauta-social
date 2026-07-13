import { expect, test } from 'vitest';
import { toDate } from '../../src/utils/schemaHelpers';

class Timestamp {
  seconds = 0;
  nanoseconds = 0;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
}

test('toDate converts string to date', () => {
  expect(toDate('2021-12-24')).toBeInstanceOf(Date);
});

test('toDate converts number to date', () => {
  expect(toDate(1639822800)).toBeInstanceOf(Date);
});

test('toDate converts firestore timestamp to date', () => {
  const timestamp = new Timestamp(1639822800, 0);
  expect(toDate(timestamp)).toBeInstanceOf(Date);
});
