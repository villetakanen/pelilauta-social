import { describe, expect, test } from 'vitest';
import type { PageRef } from '../../../src/schemas/SiteSchema';

describe('Manual TOC Sorting', () => {
  test('should sort pages by order field ascending', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 2,
      },
      {
        key: 'page-b',
        name: 'Page B',
        author: 'user1',
        flowTime: 200,
        order: 0,
      },
      {
        key: 'page-c',
        name: 'Page C',
        author: 'user1',
        flowTime: 300,
        order: 1,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted[0].key).toBe('page-b'); // order: 0
    expect(sorted[1].key).toBe('page-c'); // order: 1
    expect(sorted[2].key).toBe('page-a'); // order: 2
  });

  test('should handle missing order field by placing at end', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 1,
      },
      { key: 'page-b', name: 'Page B', author: 'user1', flowTime: 200 }, // No order
      {
        key: 'page-c',
        name: 'Page C',
        author: 'user1',
        flowTime: 300,
        order: 0,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted[0].key).toBe('page-c'); // order: 0
    expect(sorted[1].key).toBe('page-a'); // order: 1
    expect(sorted[2].key).toBe('page-b'); // No order (MAX_SAFE_INTEGER)
  });

  test('should handle all pages without order field', () => {
    const pages: PageRef[] = [
      { key: 'page-a', name: 'Page A', author: 'user1', flowTime: 100 },
      { key: 'page-b', name: 'Page B', author: 'user1', flowTime: 200 },
      { key: 'page-c', name: 'Page C', author: 'user1', flowTime: 300 },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    // All have same order (MAX_SAFE_INTEGER), so original order preserved
    expect(sorted[0].key).toBe('page-a');
    expect(sorted[1].key).toBe('page-b');
    expect(sorted[2].key).toBe('page-c');
  });

  test('should handle order field with zero value', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 2,
      },
      {
        key: 'page-b',
        name: 'Page B',
        author: 'user1',
        flowTime: 200,
        order: 0,
      }, // Zero is valid
      {
        key: 'page-c',
        name: 'Page C',
        author: 'user1',
        flowTime: 300,
        order: 1,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted[0].key).toBe('page-b'); // order: 0
    expect(sorted[1].key).toBe('page-c'); // order: 1
    expect(sorted[2].key).toBe('page-a'); // order: 2
  });

  test('should handle mixed order and no-order pages', () => {
    const pages: PageRef[] = [
      { key: 'page-a', name: 'Page A', author: 'user1', flowTime: 100 },
      {
        key: 'page-b',
        name: 'Page B',
        author: 'user1',
        flowTime: 200,
        order: 0,
      },
      { key: 'page-c', name: 'Page C', author: 'user1', flowTime: 300 },
      {
        key: 'page-d',
        name: 'Page D',
        author: 'user1',
        flowTime: 400,
        order: 1,
      },
      { key: 'page-e', name: 'Page E', author: 'user1', flowTime: 500 },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted[0].key).toBe('page-b'); // order: 0
    expect(sorted[1].key).toBe('page-d'); // order: 1
    expect(sorted[2].key).toBe('page-a'); // No order (at end)
    expect(sorted[3].key).toBe('page-c'); // No order (at end)
    expect(sorted[4].key).toBe('page-e'); // No order (at end)
  });

  test('should handle negative order values', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 1,
      },
      {
        key: 'page-b',
        name: 'Page B',
        author: 'user1',
        flowTime: 200,
        order: -1,
      },
      {
        key: 'page-c',
        name: 'Page C',
        author: 'user1',
        flowTime: 300,
        order: 0,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted[0].key).toBe('page-b'); // order: -1
    expect(sorted[1].key).toBe('page-c'); // order: 0
    expect(sorted[2].key).toBe('page-a'); // order: 1
  });

  test('should maintain stability for equal order values', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 1,
      },
      {
        key: 'page-b',
        name: 'Page B',
        author: 'user1',
        flowTime: 200,
        order: 1,
      },
      {
        key: 'page-c',
        name: 'Page C',
        author: 'user1',
        flowTime: 300,
        order: 1,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    // When order values are equal, original order is preserved (stable sort)
    expect(sorted[0].key).toBe('page-a');
    expect(sorted[1].key).toBe('page-b');
    expect(sorted[2].key).toBe('page-c');
  });

  test('should handle empty array', () => {
    const pages: PageRef[] = [];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted).toEqual([]);
  });

  test('should handle single page', () => {
    const pages: PageRef[] = [
      {
        key: 'page-a',
        name: 'Page A',
        author: 'user1',
        flowTime: 100,
        order: 5,
      },
    ];

    const sorted = [...pages].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    expect(sorted).toEqual(pages);
  });
});
