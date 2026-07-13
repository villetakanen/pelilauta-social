import type { Reactions } from 'src/schemas/ReactionsSchema';
import { describe, expect, test } from 'vitest';
import { reactionRequestSchema } from '../../src/pages/api/reactions/index';

describe('Reactions API Request Schema', () => {
  test('validates correct reaction request', () => {
    const validRequest = {
      key: 'test-thread-123',
      type: 'love' as const,
      target: 'thread' as const,
      title: 'Test Thread Title',
    };

    const result = reactionRequestSchema.parse(validRequest);
    expect(result).toEqual(validRequest);
  });

  test('validates request without optional title', () => {
    const validRequest = {
      key: 'test-site-456',
      type: 'love' as const,
      target: 'site' as const,
    };

    const result = reactionRequestSchema.parse(validRequest);
    expect(result).toEqual(validRequest);
  });

  test('rejects empty key', () => {
    const invalidRequest = {
      key: '',
      type: 'love' as const,
      target: 'thread' as const,
    };

    expect(() => reactionRequestSchema.parse(invalidRequest)).toThrow();
  });

  test('rejects invalid reaction type', () => {
    const invalidRequest = {
      key: 'test-key',
      type: 'dislike' as unknown as 'love',
      target: 'thread' as const,
    };

    expect(() => reactionRequestSchema.parse(invalidRequest)).toThrow();
  });

  test('rejects invalid target type', () => {
    const invalidRequest = {
      key: 'test-key',
      type: 'love' as const,
      target: 'page' as unknown as 'thread',
    };

    expect(() => reactionRequestSchema.parse(invalidRequest)).toThrow();
  });
});

/**
 * Helper to get a copy of the reaction array for a given type.
 */
function getReactionArray(
  reactions: Reactions,
  type: keyof Reactions,
): string[] {
  return [...(reactions[type] || [])];
}

describe('Reactions Logic', () => {
  test('adds user to empty reaction array', () => {
    const currentReactions: Reactions = { subscribers: ['owner1'] };
    const reactionArray = getReactionArray(currentReactions, 'love');
    const uid = 'user123';
    const userIndex = reactionArray.indexOf(uid);
    const wasAdded = userIndex === -1;

    expect(wasAdded).toBe(true);

    if (wasAdded) {
      reactionArray.push(uid);
    }

    expect(reactionArray).toEqual(['user123']);
  });

  test('removes user from existing reaction array', () => {
    const currentReactions: Reactions = {
      subscribers: ['owner1'],
      love: ['user123', 'user456'],
    };
    const reactionArray = getReactionArray(currentReactions, 'love');
    const uid = 'user123';
    const userIndex = reactionArray.indexOf(uid);
    const wasAdded = userIndex === -1;

    expect(wasAdded).toBe(false);

    if (!wasAdded) {
      reactionArray.splice(userIndex, 1);
    }

    expect(reactionArray).toEqual(['user456']);
  });

  test('handles user not in reaction array', () => {
    const currentReactions: Reactions = {
      subscribers: ['owner1'],
      love: ['user456', 'user789'],
    };
    const reactionArray = getReactionArray(currentReactions, 'love');
    const uid = 'user123';
    const userIndex = reactionArray.indexOf(uid);
    const wasAdded = userIndex === -1;

    expect(wasAdded).toBe(true);

    if (wasAdded) {
      reactionArray.push(uid);
    }

    expect(reactionArray).toEqual(['user456', 'user789', 'user123']);
  });
});
