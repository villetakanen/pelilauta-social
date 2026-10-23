import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  pushSessionSnack,
  snacks,
  takeSessionSnack,
} from '../../../src/utils/client/snackUtils';

const data = new Map<string, string>();
beforeEach(() => {
  data.clear();
  snacks.set([]);
  vi.stubGlobal('window', {
    sessionStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

test('an inaccessible tab hand-off does not prevent the host from mounting', () => {
  vi.stubGlobal('window', {
    get sessionStorage() {
      throw new DOMException('Blocked', 'SecurityError');
    },
  });
  expect(() => takeSessionSnack()).not.toThrow();
  expect(snacks.get()).toEqual([]);
});

test('a stored message reaches the queue once and is then removed', () => {
  pushSessionSnack({ message: 'Sign-in succeeded' });
  takeSessionSnack();
  takeSessionSnack();
  expect(snacks.get()).toEqual([{ message: 'Sign-in succeeded' }]);
  expect(data.has('snack')).toBe(false);
});

test('invalid stored feedback is removed without presentation', () => {
  data.set('snack', '{"message":"bad","action":{}}');
  takeSessionSnack();
  expect(snacks.get()).toEqual([]);
  expect(data.has('snack')).toBe(false);
});
