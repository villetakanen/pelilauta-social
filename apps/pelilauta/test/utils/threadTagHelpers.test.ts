import type { Thread } from '@schemas/ThreadSchema';
import {
  getAllThreadTags,
  isLabel,
  normalizeTag,
} from '@utils/shared/threadTagHelpers';
import { describe, expect, it } from 'vitest';

describe('normalizeTag', () => {
  it('should convert tags to lowercase', () => {
    expect(normalizeTag('DnD')).toBe('dnd');
    expect(normalizeTag('PATHFINDER')).toBe('pathfinder');
    expect(normalizeTag('Call of Cthulhu')).toBe('call of cthulhu');
  });

  it('should trim whitespace', () => {
    expect(normalizeTag('  dnd  ')).toBe('dnd');
    expect(normalizeTag('\tpathfinder\n')).toBe('pathfinder');
  });

  it('should replace multiple spaces with single space', () => {
    expect(normalizeTag('call  of   cthulhu')).toBe('call of cthulhu');
    expect(normalizeTag('dungeons    and    dragons')).toBe(
      'dungeons and dragons',
    );
  });

  it('should handle combined normalization', () => {
    expect(normalizeTag('  D&D  5e  ')).toBe('d&d 5e');
    expect(normalizeTag('Call  of   Cthulhu')).toBe('call of cthulhu');
  });

  it('should handle empty strings', () => {
    expect(normalizeTag('')).toBe('');
    expect(normalizeTag('   ')).toBe('');
  });
});

describe('getAllThreadTags', () => {
  it('should combine tags and labels', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: ['featured', 'pinned'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['dnd', 'fantasy', 'featured', 'pinned'].sort());
    expect(result.length).toBe(4);
  });

  it('should deduplicate identical tags', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: ['dnd', 'featured'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['dnd', 'fantasy', 'featured'].sort());
    expect(result.length).toBe(3);
  });

  it('should deduplicate case-insensitive matches', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'Fantasy'],
      labels: ['DnD', 'FANTASY', 'featured'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['dnd', 'fantasy', 'featured'].sort());
    expect(result.length).toBe(3);
  });

  it('should handle thread with only tags', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy', 'rpg'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['dnd', 'fantasy', 'rpg'].sort());
    expect(result.length).toBe(3);
  });

  it('should handle thread with only labels', () => {
    const thread: Partial<Thread> = {
      labels: ['featured', 'pinned', 'important'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['featured', 'pinned', 'important'].sort());
    expect(result.length).toBe(3);
  });

  it('should handle thread with no tags or labels', () => {
    const thread: Partial<Thread> = {};

    const result = getAllThreadTags(thread);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should handle undefined tags and labels', () => {
    const thread: Partial<Thread> = {
      tags: undefined,
      labels: undefined,
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual([]);
  });

  it('should handle empty arrays', () => {
    const thread: Partial<Thread> = {
      tags: [],
      labels: [],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual([]);
  });

  it('should return sorted results', () => {
    const thread: Partial<Thread> = {
      tags: ['zebra', 'alpha', 'middle'],
      labels: ['beta', 'omega'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['alpha', 'beta', 'middle', 'omega', 'zebra']);
    // Verify it's actually sorted
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it('should normalize tags with whitespace differences', () => {
    const thread: Partial<Thread> = {
      tags: ['call of cthulhu', 'dnd'],
      labels: ['Call  of   Cthulhu', 'featured'],
    };

    const result = getAllThreadTags(thread);

    expect(result).toEqual(['call of cthulhu', 'dnd', 'featured'].sort());
    expect(result.length).toBe(3);
  });
});

describe('isLabel', () => {
  it('should return true for existing labels', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: ['featured', 'pinned'],
    };

    expect(isLabel(thread, 'featured')).toBe(true);
    expect(isLabel(thread, 'pinned')).toBe(true);
  });

  it('should return false for tags that are not labels', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: ['featured', 'pinned'],
    };

    expect(isLabel(thread, 'dnd')).toBe(false);
    expect(isLabel(thread, 'fantasy')).toBe(false);
  });

  it('should return false for non-existent tags', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: ['featured', 'pinned'],
    };

    expect(isLabel(thread, 'unknown')).toBe(false);
    expect(isLabel(thread, 'nonexistent')).toBe(false);
  });

  it('should handle case-insensitive matching', () => {
    const thread: Partial<Thread> = {
      labels: ['Featured', 'Pinned'],
    };

    expect(isLabel(thread, 'featured')).toBe(true);
    expect(isLabel(thread, 'FEATURED')).toBe(true);
    expect(isLabel(thread, 'pinned')).toBe(true);
    expect(isLabel(thread, 'PINNED')).toBe(true);
  });

  it('should return false when labels is undefined', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
    };

    expect(isLabel(thread, 'featured')).toBe(false);
  });

  it('should return false when labels is empty array', () => {
    const thread: Partial<Thread> = {
      tags: ['dnd', 'fantasy'],
      labels: [],
    };

    expect(isLabel(thread, 'featured')).toBe(false);
  });

  it('should return false for empty thread', () => {
    const thread: Partial<Thread> = {};

    expect(isLabel(thread, 'featured')).toBe(false);
  });

  it('should handle whitespace normalization in comparison', () => {
    const thread: Partial<Thread> = {
      labels: ['call  of   cthulhu', 'featured'],
    };

    expect(isLabel(thread, 'call of cthulhu')).toBe(true);
    expect(isLabel(thread, 'Call  of   Cthulhu')).toBe(true);
    expect(isLabel(thread, '  call of cthulhu  ')).toBe(true);
  });

  it('should not match partial strings', () => {
    const thread: Partial<Thread> = {
      labels: ['featured'],
    };

    expect(isLabel(thread, 'feature')).toBe(false);
    expect(isLabel(thread, 'feat')).toBe(false);
  });
});
