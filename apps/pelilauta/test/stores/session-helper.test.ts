import { atom } from 'nanostores';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SessionState } from '../../src/stores/session';

// Mock the session stores to avoid Firebase initialization
vi.mock('../../src/stores/session', () => ({
  sessionState: atom<SessionState>('initial'),
  uid: atom<string>(''),
}));

// Import after mocking
const { sessionState, uid } = await import('../../src/stores/session');
const { isAnonymous, isRehydrating, isActive } = await import(
  '../../src/stores/session/computed'
);

describe('Session State Helpers', () => {
  beforeEach(() => {
    // Reset to clean state before each test
    sessionState.set('initial');
    uid.set('');
  });

  describe('isAnonymous', () => {
    test('should return true when no UID and state is initial', () => {
      sessionState.set('initial');
      uid.set('');

      expect(isAnonymous.get()).toBe(true);
    });

    test('should return false when UID exists', () => {
      sessionState.set('initial');
      uid.set('user_123');

      expect(isAnonymous.get()).toBe(false);
    });

    test('should return false when state is active even without UID', () => {
      sessionState.set('active');
      uid.set('');

      expect(isAnonymous.get()).toBe(false);
    });

    test('should return false when state is loading', () => {
      sessionState.set('loading');
      uid.set('');

      expect(isAnonymous.get()).toBe(false);
    });

    test('should return false when state is error', () => {
      sessionState.set('error');
      uid.set('');

      expect(isAnonymous.get()).toBe(false);
    });
  });

  describe('isRehydrating', () => {
    test('should return true when UID exists and state is initial', () => {
      sessionState.set('initial');
      uid.set('user_123');

      expect(isRehydrating.get()).toBe(true);
    });

    test('should return true when UID exists and state is loading', () => {
      sessionState.set('loading');
      uid.set('user_123');

      expect(isRehydrating.get()).toBe(true);
    });

    test('should return false when UID exists and state is active', () => {
      sessionState.set('active');
      uid.set('user_123');

      expect(isRehydrating.get()).toBe(false);
    });

    test('should return false when no UID exists', () => {
      sessionState.set('initial');
      uid.set('');

      expect(isRehydrating.get()).toBe(false);
    });

    test('should return false when UID exists and state is error', () => {
      sessionState.set('error');
      uid.set('user_123');

      expect(isRehydrating.get()).toBe(false);
    });

    test('should handle empty string UID as no UID', () => {
      sessionState.set('loading');
      uid.set('');

      expect(isRehydrating.get()).toBe(false);
    });
  });

  describe('isActive', () => {
    test('should return true only when UID exists AND state is active', () => {
      sessionState.set('active');
      uid.set('user_123');

      expect(isActive.get()).toBe(true);
    });

    test('should return false when state is loading even with UID', () => {
      sessionState.set('loading');
      uid.set('user_123');

      expect(isActive.get()).toBe(false);
    });

    test('should return false when state is error even with UID', () => {
      sessionState.set('error');
      uid.set('user_123');

      expect(isActive.get()).toBe(false);
    });

    test('should return false when state is initial even with UID', () => {
      sessionState.set('initial');
      uid.set('user_123');

      expect(isActive.get()).toBe(false);
    });

    test('should return false when state is active but no UID', () => {
      sessionState.set('active');
      uid.set('');

      expect(isActive.get()).toBe(false);
    });

    test('should handle empty string UID as no UID', () => {
      sessionState.set('active');
      uid.set('');

      expect(isActive.get()).toBe(false);
    });
  });

  describe('State transitions', () => {
    test('should handle transition from anonymous to rehydrating', () => {
      // Start anonymous
      sessionState.set('initial');
      uid.set('');
      expect(isAnonymous.get()).toBe(true);
      expect(isRehydrating.get()).toBe(false);
      expect(isActive.get()).toBe(false);

      // Transition to rehydrating (UID loaded from localStorage)
      uid.set('user_123');
      expect(isAnonymous.get()).toBe(false);
      expect(isRehydrating.get()).toBe(true);
      expect(isActive.get()).toBe(false);
    });

    test('should handle transition from rehydrating to active', () => {
      // Start rehydrating
      sessionState.set('initial');
      uid.set('user_123');
      expect(isRehydrating.get()).toBe(true);
      expect(isActive.get()).toBe(false);

      // Transition to loading
      sessionState.set('loading');
      expect(isRehydrating.get()).toBe(true);
      expect(isActive.get()).toBe(false);

      // Transition to active
      sessionState.set('active');
      expect(isRehydrating.get()).toBe(false);
      expect(isActive.get()).toBe(true);
    });

    test('should handle transition from active to anonymous (logout)', () => {
      // Start active
      sessionState.set('active');
      uid.set('user_123');
      expect(isActive.get()).toBe(true);
      expect(isAnonymous.get()).toBe(false);

      // Transition to loading (logout starting)
      sessionState.set('loading');
      expect(isActive.get()).toBe(false);
      expect(isRehydrating.get()).toBe(true);

      // Clear UID
      uid.set('');
      expect(isRehydrating.get()).toBe(false);

      // Transition to initial
      sessionState.set('initial');
      expect(isAnonymous.get()).toBe(true);
      expect(isActive.get()).toBe(false);
    });

    test('should handle error state correctly', () => {
      sessionState.set('error');
      uid.set('user_123');

      expect(isAnonymous.get()).toBe(false);
      expect(isRehydrating.get()).toBe(false);
      expect(isActive.get()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle whitespace UID as valid UID', () => {
      sessionState.set('active');
      uid.set('   ');

      // Whitespace is technically a non-empty string
      expect(isActive.get()).toBe(true);
    });

    test('should be mutually exclusive in normal flows', () => {
      // Test all valid state combinations to ensure no overlap
      const testCases = [
        {
          state: 'initial' as const,
          uid: '',
          expectAnonymous: true,
          expectRehydrating: false,
          expectActive: false,
        },
        {
          state: 'initial' as const,
          uid: 'user_123',
          expectAnonymous: false,
          expectRehydrating: true,
          expectActive: false,
        },
        {
          state: 'loading' as const,
          uid: '',
          expectAnonymous: false,
          expectRehydrating: false,
          expectActive: false,
        },
        {
          state: 'loading' as const,
          uid: 'user_123',
          expectAnonymous: false,
          expectRehydrating: true,
          expectActive: false,
        },
        {
          state: 'active' as const,
          uid: '',
          expectAnonymous: false,
          expectRehydrating: false,
          expectActive: false,
        },
        {
          state: 'active' as const,
          uid: 'user_123',
          expectAnonymous: false,
          expectRehydrating: false,
          expectActive: true,
        },
        {
          state: 'error' as const,
          uid: '',
          expectAnonymous: false,
          expectRehydrating: false,
          expectActive: false,
        },
        {
          state: 'error' as const,
          uid: 'user_123',
          expectAnonymous: false,
          expectRehydrating: false,
          expectActive: false,
        },
      ];

      for (const testCase of testCases) {
        sessionState.set(testCase.state);
        uid.set(testCase.uid);

        expect(isAnonymous.get()).toBe(testCase.expectAnonymous);
        expect(isRehydrating.get()).toBe(testCase.expectRehydrating);
        expect(isActive.get()).toBe(testCase.expectActive);
      }
    });
  });
});
