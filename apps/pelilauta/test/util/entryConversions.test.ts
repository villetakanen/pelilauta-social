import { parseFrontmatter, toEntryDate } from 'src/utils/entryConversions';
import { describe, expect, it } from 'vitest';

describe('parseFrontmatter', () => {
  it('splits frontmatter from the body', () => {
    const { frontmatter, body } = parseFrontmatter(
      '---\nname: Beta\n---\nThe body.\n',
    );

    expect(frontmatter.name).toBe('Beta');
    expect(body).toBe('The body.');
  });

  it('reads a file without frontmatter as all body', () => {
    const { frontmatter, body } = parseFrontmatter('Just text.');

    expect(frontmatter).toEqual({});
    expect(body).toBe('Just text.');
  });

  it('coerces booleans and numbers, and unquotes strings', () => {
    const { frontmatter } = parseFrontmatter(
      '---\npublic: true\norder: 3\nname: "Beta"\n---\nBody\n',
    );

    expect(frontmatter.public).toBe(true);
    expect(frontmatter.order).toBe(3);
    expect(frontmatter.name).toBe('Beta');
  });

  it('keeps an ISO date a string, so it survives as a date', () => {
    const { frontmatter } = parseFrontmatter(
      '---\ncreated: 2009-11-03T14:56:01.000Z\n---\nBody\n',
    );

    expect(frontmatter.created).toBe('2009-11-03T14:56:01.000Z');
  });
});

describe('toEntryDate', () => {
  it('reads an ISO timestamp', () => {
    expect(toEntryDate('2009-11-03T14:56:01.000Z')?.toISOString()).toBe(
      '2009-11-03T14:56:01.000Z',
    );
  });

  it('reads a plain date', () => {
    expect(toEntryDate('2009-11-03')?.toISOString()).toBe(
      '2009-11-03T00:00:00.000Z',
    );
  });

  it('drops a value it cannot read, leaving the entry to server time', () => {
    expect(toEntryDate('not a date')).toBeUndefined();
    expect(toEntryDate('')).toBeUndefined();
    expect(toEntryDate(undefined)).toBeUndefined();
    expect(toEntryDate(1257271361)).toBeUndefined();
  });
});
