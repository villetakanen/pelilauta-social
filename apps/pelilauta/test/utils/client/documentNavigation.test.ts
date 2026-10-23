import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { navigateToDocument } from '../../../src/utils/client/documentNavigation';

const assign = vi.fn();
const replace = vi.fn();
const reload = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', {
    location: {
      href: 'https://example.com/settings?view=list#latest',
      assign,
      replace,
      reload,
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

test.each([false, true])(
  'the same protected address reloads its document (replace: %s)',
  (replaceHistory) => {
    navigateToDocument('/settings?view=list#latest', replaceHistory);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  },
);

test('a different recovery destination replaces history', () => {
  navigateToDocument('/inbox#latest', true);
  expect(replace).toHaveBeenCalledExactlyOnceWith('/inbox#latest');
  expect(reload).not.toHaveBeenCalled();
});

test('normal login navigates to a different destination', () => {
  navigateToDocument('/inbox#latest');
  expect(assign).toHaveBeenCalledExactlyOnceWith('/inbox#latest');
});

test('navigation rejects unsafe and recursive destinations', () => {
  navigateToDocument('/login?redirect=https://evil.example');
  expect(assign).toHaveBeenCalledExactlyOnceWith('/');
});
