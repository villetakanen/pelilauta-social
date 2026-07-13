import { Marked } from 'marked';
import { expect, test } from 'vitest';
import { createProfileTagExtension } from '../../src/utils/shared/marked/createProfileTagExtension';

// Helper function to create a marked instance with just the profile tag extension
function getMarkedWithProfileTags(baseUrl: string) {
  const marked = new Marked({
    gfm: false, // Disable GFM to avoid email auto-linking
    breaks: true,
    pedantic: false,
  });

  marked.use(createProfileTagExtension(baseUrl));
  return marked;
}

test('createProfileTagExtension should convert a basic @profile tag into a link', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('Hello @test-user');
  expect(result).toContain(
    '<a href="https://example.com/profiles/test-user">@test-user</a>',
  );
});

test('createProfileTagExtension should not convert an email address', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const markdown = 'My email is test@example.com.';
  const result = await marked.parse(markdown);
  expect(result).toBe('<p>My email is test@example.com.</p>\n');
});

test('createProfileTagExtension should convert a tag at the beginning of a line', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('@start');
  expect(result).toContain(
    '<a href="https://example.com/profiles/start">@start</a>',
  );
});

test('createProfileTagExtension should handle multiple tags correctly', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('cc @admin and @moderator');
  expect(result).toContain(
    '<a href="https://example.com/profiles/admin">@admin</a>',
  );
  expect(result).toContain(
    '<a href="https://example.com/profiles/moderator">@moderator</a>',
  );
});

test('createProfileTagExtension should handle tags with special characters like ä, ö, å', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('Ping @käyttäjä-1');
  const expectedHref = 'https://example.com/profiles/k%C3%A4ytt%C3%A4j%C3%A4-1';
  expect(result).toContain(`<a href="${expectedHref}">@käyttäjä-1</a>`);
});

test('createProfileTagExtension should not convert a tag that is not preceded by whitespace', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const markdown = 'Anexample@tag';
  const result = await marked.parse(markdown);
  expect(result).toBe('<p>Anexample@tag</p>\n');
});

test('createProfileTagExtension should handle a tag at the end of the string', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('This is a test for @final-tag');
  expect(result).toContain(
    '<a href="https://example.com/profiles/final-tag">@final-tag</a>',
  );
});

test('createProfileTagExtension should handle a tag followed by punctuation', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse('Hello @user, how are you?');
  expect(result).toContain(
    '<a href="https://example.com/profiles/user">@user</a>',
  );
});

test('createProfileTagExtension should handle multiple tags in one sentence', async () => {
  const marked = getMarkedWithProfileTags('https://example.com');
  const result = await marked.parse(
    'Meeting with @alice and @bob about @project-x',
  );
  expect(result).toContain(
    '<a href="https://example.com/profiles/alice">@alice</a>',
  );
  expect(result).toContain(
    '<a href="https://example.com/profiles/bob">@bob</a>',
  );
  expect(result).toContain(
    '<a href="https://example.com/profiles/project-x">@project-x</a>',
  );
});

test('createProfileTagExtension should require baseUrl parameter', () => {
  expect(() => createProfileTagExtension('')).toThrow(
    'baseUrl is required for profile tag extension.',
  );
});
