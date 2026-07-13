import { toTagData } from '@utils/shared/toTagData';
import { describe, expect, it } from 'vitest';

describe('toTagData', () => {
  it('should normalize tags to lowercase', () => {
    const entry = {
      title: 'Test Thread',
      tags: ['DnD', 'PathFinder', 'D&D'],
      owners: ['user123'],
    };

    const result = toTagData(entry, 'thread-key', 'thread', Date.now());

    expect(result.tags).toEqual(['dnd', 'pathfinder', 'd&d']);
  });

  it('should handle empty tags array', () => {
    const entry = {
      title: 'Test Thread',
      tags: [],
      owners: ['user123'],
    };

    const result = toTagData(entry, 'thread-key', 'thread', Date.now());

    expect(result.tags).toEqual([]);
  });

  it('should handle undefined tags', () => {
    const entry = {
      title: 'Test Thread',
      owners: ['user123'],
    };

    const result = toTagData(entry, 'thread-key', 'thread', Date.now());

    expect(result.tags).toEqual([]);
  });

  it('should work with page entries using name instead of title', () => {
    const entry = {
      name: 'Test Page',
      tags: ['RPG', 'Fantasy'],
      owners: ['user456'],
    };

    const result = toTagData(entry, 'site/page-key', 'page', Date.now());

    expect(result.title).toBe('Test Page');
    expect(result.tags).toEqual(['rpg', 'fantasy']);
    expect(result.type).toBe('page');
  });

  it('should extract author from owners array', () => {
    const entry = {
      title: 'Test Thread',
      tags: ['test'],
      owners: ['user1', 'user2', 'user3'],
    };

    const result = toTagData(entry, 'thread-key', 'thread', Date.now());

    expect(result.author).toBe('user1');
  });

  it('should handle empty owners array', () => {
    const entry = {
      title: 'Test Thread',
      tags: ['test'],
      owners: [],
    };

    const result = toTagData(entry, 'thread-key', 'thread', Date.now());

    expect(result.author).toBe('');
  });

  it('should preserve flowTime', () => {
    const flowTime = Date.now();
    const entry = {
      title: 'Test Thread',
      tags: ['test'],
      owners: ['user123'],
    };

    const result = toTagData(entry, 'thread-key', 'thread', flowTime);

    expect(result.flowTime).toBe(flowTime);
  });
});
