import { PageSchema, parsePage } from 'src/schemas/PageSchema';
import { describe, expect, it } from 'vitest';

describe('PageSchema with author field', () => {
  it('should accept author field', () => {
    const page = PageSchema.parse({
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      owners: ['user1', 'user2'],
      author: 'user2',
      markdownContent: '# Test',
      flowTime: Date.now(),
    });

    expect(page.author).toBe('user2');
  });

  it('should handle missing author field (backward compatibility)', () => {
    const pageData = {
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      owners: ['user1', 'user2'],
      markdownContent: '# Test',
      flowTime: Date.now(),
    };

    const page = parsePage(pageData, 'test-page', 'test-site');

    // Should fallback to owners[0]
    expect(page.author).toBe('user1');
  });

  it('should handle page with no owners and no author', () => {
    const pageData = {
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      markdownContent: '# Test',
      flowTime: Date.now(),
    };

    const page = parsePage(pageData, 'test-page', 'test-site');

    // Should fallback to empty string
    expect(page.author).toBe('');
  });

  it('should use explicit author even when owners exist', () => {
    const pageData = {
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      owners: ['user1', 'user2'],
      author: 'user3',
      markdownContent: '# Test',
      flowTime: Date.now(),
    };

    const page = parsePage(pageData, 'test-page', 'test-site');

    // Should use the explicit author, not owners[0]
    expect(page.author).toBe('user3');
  });
});
