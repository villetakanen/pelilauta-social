import { describe, expect, it } from 'vitest';
import {
  addEllipsisToHtml,
  addHeaderClasses,
  addParagraphClasses,
  createPlainSnippet,
  createRichSnippet,
  getVisibleTextLength,
  smartTruncateHtml,
} from '../../src/utils/snippetHelpers';

describe('snippetHelpers', () => {
  describe('createRichSnippet', () => {
    it('should return empty string for empty input', async () => {
      const result = await createRichSnippet('');
      expect(result).toBe('');
    });

    it('should return empty string for whitespace-only input', async () => {
      const result = await createRichSnippet('   \n  \t  ');
      expect(result).toBe('');
    });

    it('should render simple markdown to HTML', async () => {
      const result = await createRichSnippet('# Hello World');
      expect(result).toContain('<h1');
      expect(result).toContain('Hello World');
      expect(result).toContain('text-h5');
    });

    it('should add text-h5 class to headers by default', async () => {
      const result = await createRichSnippet('# H1\n## H2\n### H3');
      expect(result).toContain('<h1 class="text-h5">H1</h1>');
      expect(result).toContain('<h2 class="text-h5">H2</h2>');
      expect(result).toContain('<h3 class="text-h5">H3</h3>');
    });

    it('should allow custom header classes', async () => {
      const result = await createRichSnippet('# Hello', {
        headerClasses: ['custom-class', 'another-class'],
      });
      expect(result).toContain('custom-class another-class');
    });

    it('should not add paragraph classes by default', async () => {
      const result = await createRichSnippet(
        'This is a paragraph.\n\nAnother paragraph.',
      );
      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<p>Another paragraph.</p>');
      expect(result).not.toContain('class="text-small"');
    });

    it('should allow custom paragraph classes', async () => {
      const result = await createRichSnippet('Simple text.', {
        paragraphClasses: ['custom-p', 'another-p'],
      });
      expect(result).toContain('custom-p another-p');
    });

    it('should allow disabling paragraph classes', async () => {
      const result = await createRichSnippet('Simple text.', {
        paragraphClasses: [],
      });
      expect(result).toContain('<p>Simple text.</p>');
      expect(result).not.toContain('class=');
    });

    it('should not truncate content shorter than maxLength', async () => {
      const content = 'Short text';
      const result = await createRichSnippet(content, { maxLength: 100 });
      expect(result).toContain('Short text');
      expect(result).not.toContain('...');
    });

    it('should truncate content longer than maxLength', async () => {
      const content = 'A'.repeat(300);
      const result = await createRichSnippet(content, { maxLength: 100 });
      const visibleText = result.replace(/<[^>]*>/g, '');
      expect(visibleText.length).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('should add ellipsis when truncated by default', async () => {
      const content = 'A'.repeat(300);
      const result = await createRichSnippet(content, { maxLength: 100 });
      expect(result).toContain('...');
    });

    it('should not add ellipsis when addEllipsis is false', async () => {
      const content = 'A'.repeat(300);
      const result = await createRichSnippet(content, {
        maxLength: 100,
        addEllipsis: false,
      });
      expect(result).not.toContain('...');
    });

    it('should properly render bold text', async () => {
      const result = await createRichSnippet('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should properly render italic text', async () => {
      const result = await createRichSnippet('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should properly render links', async () => {
      const result = await createRichSnippet('[Example](https://example.com)');
      expect(result).toContain('<a href="https://example.com">Example</a>');
    });

    it('should properly render lists', async () => {
      const result = await createRichSnippet('- Item 1\n- Item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    it('should handle complex markdown with multiple elements', async () => {
      const markdown = `# Welcome

This is a **bold** statement with *emphasis*.

- List item 1
- List item 2

[Link](https://example.com)`;

      const result = await createRichSnippet(markdown);
      expect(result).toContain('<h1 class="text-h5">Welcome</h1>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>emphasis</em>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<a href="https://example.com">Link</a>');
    });

    it('should use default maxLength of 220', async () => {
      const content = 'A'.repeat(300);
      const result = await createRichSnippet(content);
      const visibleText = result.replace(/<[^>]*>/g, '');
      expect(visibleText.length).toBeLessThanOrEqual(223); // 220 + '...'
    });

    it('should preserve HTML structure when truncating', async () => {
      const markdown = `This is **bold** and this is *italic* text. ${'A'.repeat(200)}`;
      const result = await createRichSnippet(markdown, { maxLength: 50 });

      // Should have properly closed tags
      const openTags = (result.match(/<(?!\/)\w+/g) || []).length;
      const closeTags = (result.match(/<\/\w+/g) || []).length;

      // All opening tags should be closed (excluding self-closing tags)
      expect(openTags).toBe(closeTags);
    });
  });

  describe('createPlainSnippet', () => {
    it('should return empty string for empty input', () => {
      const result = createPlainSnippet('');
      expect(result).toBe('');
    });

    it('should return empty string for whitespace-only input', () => {
      const result = createPlainSnippet('   \n  \t  ');
      expect(result).toBe('');
    });

    it('should remove header markdown syntax', () => {
      const result = createPlainSnippet('# Header 1\n## Header 2');
      expect(result).toBe('Header 1 Header 2');
    });

    it('should convert links to plain text', () => {
      const result = createPlainSnippet('[Example](https://example.com)');
      expect(result).toBe('Example');
    });

    it('should remove bold formatting', () => {
      const result = createPlainSnippet('This is **bold** text');
      expect(result).toBe('This is bold text');
    });

    it('should remove italic formatting', () => {
      const result = createPlainSnippet('This is *italic* text');
      expect(result).toBe('This is italic text');
    });

    it('should remove inline code', () => {
      const result = createPlainSnippet('Use `console.log()` for debugging');
      expect(result).toBe('Use console.log() for debugging');
    });

    it('should remove code blocks', () => {
      const result = createPlainSnippet('```javascript\nconst x = 1;\n```');
      expect(result).toBe('');
    });

    it('should remove list markers', () => {
      const result = createPlainSnippet('- Item 1\n- Item 2\n+ Item 3');
      expect(result).toBe('Item 1 Item 2 Item 3');
    });

    it('should remove numbered list markers', () => {
      const result = createPlainSnippet('1. First\n2. Second\n3. Third');
      expect(result).toBe('First Second Third');
    });

    it('should remove blockquote markers', () => {
      const result = createPlainSnippet('> This is a quote');
      expect(result).toBe('This is a quote');
    });

    it('should remove image markdown', () => {
      const result = createPlainSnippet('![Alt text](image.png)');
      expect(result).toBe('Alt text');
    });

    it('should remove HTML tags', () => {
      const result = createPlainSnippet('This is <strong>bold</strong>');
      expect(result).toBe('This is bold');
    });

    it('should normalize whitespace', () => {
      const result = createPlainSnippet(
        'Text\n\nWith\n\n\nMultiple\n\n\n\nNewlines',
      );
      expect(result).toBe('Text With Multiple Newlines');
    });

    it('should truncate at word boundary when possible', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const result = createPlainSnippet(text, 20);
      expect(result).toBe('The quick brown fox...');
      expect(result.length).toBeLessThanOrEqual(23);
    });

    it('should not cut too far back for word boundary', () => {
      const text = 'Supercalifragilisticexpialidocious';
      const result = createPlainSnippet(text, 20);
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should use default maxLength of 220', () => {
      const text = 'A'.repeat(300);
      const result = createPlainSnippet(text);
      expect(result.length).toBe(223); // 220 + '...'
    });

    it('should not add ellipsis if text is shorter than maxLength', () => {
      const text = 'Short text';
      const result = createPlainSnippet(text, 100);
      expect(result).toBe('Short text');
      expect(result).not.toContain('...');
    });

    it('should handle complex markdown with multiple formatting', () => {
      const markdown = `# Welcome

This is **bold** and *italic* with [a link](https://example.com).

- List item
- Another item

> A quote`;

      const result = createPlainSnippet(markdown);
      expect(result).toBe(
        'Welcome This is bold and italic with a link. List item Another item A quote',
      );
    });
  });

  describe('addHeaderClasses', () => {
    it('should add classes to h1 tags', () => {
      const html = '<h1>Title</h1>';
      const result = addHeaderClasses(html, ['text-h5']);
      expect(result).toBe('<h1 class="text-h5">Title</h1>');
    });

    it('should add classes to all header levels', () => {
      const html =
        '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
      const result = addHeaderClasses(html, ['custom']);
      expect(result).toContain('<h1 class="custom">H1</h1>');
      expect(result).toContain('<h2 class="custom">H2</h2>');
      expect(result).toContain('<h3 class="custom">H3</h3>');
      expect(result).toContain('<h4 class="custom">H4</h4>');
      expect(result).toContain('<h5 class="custom">H5</h5>');
      expect(result).toContain('<h6 class="custom">H6</h6>');
    });

    it('should add multiple classes', () => {
      const html = '<h1>Title</h1>';
      const result = addHeaderClasses(html, ['class1', 'class2', 'class3']);
      expect(result).toBe('<h1 class="class1 class2 class3">Title</h1>');
    });

    it('should append to existing classes', () => {
      const html = '<h1 class="existing">Title</h1>';
      const result = addHeaderClasses(html, ['new']);
      expect(result).toBe('<h1 class="existing new">Title</h1>');
    });

    it('should return original HTML if no classes provided', () => {
      const html = '<h1>Title</h1>';
      const result = addHeaderClasses(html, []);
      expect(result).toBe(html);
    });

    it('should handle case-insensitive tags', () => {
      const html = '<H1>Title</H1><H2>Subtitle</H2>';
      const result = addHeaderClasses(html, ['text-h5']);
      expect(result).toContain('class="text-h5"');
    });
  });

  describe('addParagraphClasses', () => {
    it('should add classes to p tags', () => {
      const html = '<p>Content</p>';
      const result = addParagraphClasses(html, ['text-small']);
      expect(result).toBe('<p class="text-small">Content</p>');
    });

    it('should add classes to multiple paragraphs', () => {
      const html = '<p>First</p><p>Second</p><p>Third</p>';
      const result = addParagraphClasses(html, ['text-small']);
      expect(result).toContain('<p class="text-small">First</p>');
      expect(result).toContain('<p class="text-small">Second</p>');
      expect(result).toContain('<p class="text-small">Third</p>');
    });

    it('should add multiple classes', () => {
      const html = '<p>Text</p>';
      const result = addParagraphClasses(html, ['text-small', 'color-muted']);
      expect(result).toBe('<p class="text-small color-muted">Text</p>');
    });

    it('should append to existing classes', () => {
      const html = '<p class="existing">Text</p>';
      const result = addParagraphClasses(html, ['text-small']);
      expect(result).toBe('<p class="existing text-small">Text</p>');
    });

    it('should not duplicate classes', () => {
      const html = '<p class="text-small">Text</p>';
      const result = addParagraphClasses(html, ['text-small']);
      expect(result).toBe('<p class="text-small">Text</p>');
    });

    it('should return original HTML if no classes provided', () => {
      const html = '<p>Text</p>';
      const result = addParagraphClasses(html, []);
      expect(result).toBe(html);
    });

    it('should handle case-insensitive tags', () => {
      const html = '<P>Text</P>';
      const result = addParagraphClasses(html, ['text-small']);
      expect(result).toContain('class="text-small"');
    });
  });

  describe('getVisibleTextLength', () => {
    it('should count text without HTML tags', () => {
      const html = '<p>Hello World</p>';
      const result = getVisibleTextLength(html);
      expect(result).toBe(11); // "Hello World"
    });

    it('should exclude all HTML tags from count', () => {
      const html = '<div><strong>Bold</strong> and <em>italic</em></div>';
      const result = getVisibleTextLength(html);
      expect(result).toBe(15); // "Bold and italic"
    });

    it('should count nested HTML correctly', () => {
      const html = '<div><p><span>Test</span></p></div>';
      const result = getVisibleTextLength(html);
      expect(result).toBe(4); // "Test"
    });

    it('should return 0 for HTML with no text', () => {
      const html = '<div></div><p></p>';
      const result = getVisibleTextLength(html);
      expect(result).toBe(0);
    });

    it('should count whitespace', () => {
      const html = '<p>Hello   World</p>';
      const result = getVisibleTextLength(html);
      expect(result).toBe(13); // "Hello   World"
    });
  });

  describe('smartTruncateHtml', () => {
    it('should truncate at character limit', () => {
      const html = '<p>This is a long text that needs truncation</p>';
      const result = smartTruncateHtml(html, 20, true);
      const visibleText = result.replace(/<[^>]*>/g, '');
      expect(visibleText.length).toBe(20);
    });

    it('should properly close tags after truncation', () => {
      const html = '<p>This is <strong>bold text</strong> that continues</p>';
      const result = smartTruncateHtml(html, 20, true);
      expect(result).toContain('</strong>');
      expect(result).toContain('</p>');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><strong>Text</strong></p></div>';
      const result = smartTruncateHtml(html, 2, true);
      expect(result).toBe('<div><p><strong>Te</strong></p></div>');
    });

    it('should not break in middle of HTML tag', () => {
      const html = '<p>Text with <a href="link">a link</a></p>';
      const result = smartTruncateHtml(html, 15, true);
      // Should not have broken/malformed tags (no tags cut mid-way)
      expect(result).not.toMatch(/<[^>]*$/); // No unclosed tag at end
      expect(result).not.toMatch(/<a[^>]*[^>]$/); // No broken anchor tag
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Text with <br/> break</p>';
      const result = smartTruncateHtml(html, 20, true);
      expect(result).toContain('</p>');
    });

    it('should handle multiple nested levels', () => {
      const html =
        '<div><section><article><p>Deep nesting</p></article></section></div>';
      const result = smartTruncateHtml(html, 4, true);
      expect(result).toBe(
        '<div><section><article><p>Deep</p></article></section></div>',
      );
    });

    it('should return all content if shorter than maxLength', () => {
      const html = '<p>Short</p>';
      const result = smartTruncateHtml(html, 100, true);
      expect(result).toBe('<p>Short</p>');
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = smartTruncateHtml(html, 10, true);
      expect(result).toBe('');
    });

    it('should properly close tags in reverse order', () => {
      const html = '<div><p><strong>Text</strong></p></div>';
      const result = smartTruncateHtml(html, 2, true);
      // Tags should close in proper order
      const openTags = result.match(/<(?!\/|br|hr|img)\w+/g) || [];
      const closeTags = result.match(/<\/\w+/g) || [];
      expect(openTags.length).toBe(closeTags.length);
    });
  });

  describe('addEllipsisToHtml', () => {
    it('should add ellipsis before closing tags', () => {
      const html = '<p>Text</p>';
      const result = addEllipsisToHtml(html);
      expect(result).toBe('<p>Text...</p>');
    });

    it('should add ellipsis before multiple closing tags', () => {
      const html = '<div><p><strong>Text</strong></p></div>';
      const result = addEllipsisToHtml(html);
      expect(result).toContain('...');
      expect(result).toContain('</strong></p></div>');
    });

    it('should trim whitespace before ellipsis', () => {
      const html = '<p>Text   </p>';
      const result = addEllipsisToHtml(html);
      expect(result).toBe('<p>Text...</p>');
    });

    it('should handle HTML without closing tags', () => {
      const html = 'Plain text';
      const result = addEllipsisToHtml(html);
      expect(result).toBe('Plain text...');
    });

    it('should work with nested HTML', () => {
      const html = '<section><div><p>Content</p></div></section>';
      const result = addEllipsisToHtml(html);
      expect(result).toContain('...');
      expect(result).toContain('</p></div></section>');
    });
  });

  describe('integration tests', () => {
    it('should handle real-world thread content', async () => {
      const markdown = `# Welcome to the Adventure

This is an exciting **new campaign** for our group!

## What to Expect

- Epic battles
- Mysterious dungeons
- Character development

Check out the [player guide](https://example.com/guide) for more info.`;

      const result = await createRichSnippet(markdown, { maxLength: 150 });

      expect(result).toContain('text-h5');
      expect(result).toContain('<strong>new campaign</strong>');
      expect(result).toContain('...');

      const visibleText = result.replace(/<[^>]*>/g, '');
      expect(visibleText.length).toBeLessThanOrEqual(153);
    });

    it('should create SEO-friendly plain snippets', () => {
      const markdown = `# Game Session Report

Last night's **D&D** session was *amazing*! 

- We defeated the dragon
- Found legendary loot
- Leveled up

Can't wait for next week!`;

      const result = createPlainSnippet(markdown, 100);

      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('-');
      expect(result).toContain('...');
    });

    it('should handle edge case with only headers', async () => {
      const markdown = '# Title\n## Subtitle\n### Section';
      const result = await createRichSnippet(markdown, { maxLength: 50 });

      expect(result).toContain('<h1 class="text-h5">Title</h1>');
      expect(result).toContain('<h2 class="text-h5">Subtitle</h2>');
    });

    it('should handle markdown with special characters', async () => {
      const markdown = 'Text with äöü and émojis 🎮 and symbols & < >';
      const result = await createRichSnippet(markdown);

      expect(result).toContain('äöü');
      expect(result).toContain('🎮');
    });

    it('should maintain consistency between rich and plain snippets', async () => {
      const markdown = '# Title\n\nSome **bold** text with *emphasis*.';

      const richSnippet = await createRichSnippet(markdown, { maxLength: 30 });
      const plainSnippet = createPlainSnippet(markdown, 30);

      // Both should have ellipsis
      expect(richSnippet).toContain('...');
      expect(plainSnippet).toContain('...');

      // Plain should have no HTML
      expect(plainSnippet).not.toContain('<');
      expect(plainSnippet).not.toContain('>');
    });
  });
});
