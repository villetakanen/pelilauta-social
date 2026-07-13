import { describe, expect, it } from 'vitest';
import {
  migrateProfile,
  ProfileSchema,
  parseProfile,
} from '../../src/schemas/ProfileSchema';

describe('ProfileSchema', () => {
  it('should parse valid profile data', () => {
    const data = {
      key: 'user123',
      username: 'testuser',
      nick: 'Test User',
      avatarURL: 'https://example.com/avatar.jpg',
      bio: 'Hello world',
      tags: ['rpg', 'fantasy'],
      lovedThreads: ['thread1', 'thread2'],
    };

    const profile = ProfileSchema.parse(data);

    expect(profile.key).toBe('user123');
    expect(profile.username).toBe('testuser');
    expect(profile.nick).toBe('Test User');
    expect(profile.avatarURL).toBe('https://example.com/avatar.jpg');
    expect(profile.bio).toBe('Hello world');
    expect(profile.tags).toEqual(['rpg', 'fantasy']);
    expect(profile.lovedThreads).toEqual(['thread1', 'thread2']);
  });

  it('should parse profile data with minimal required fields', () => {
    const data = {
      key: 'user123',
      username: 'testuser',
      nick: 'Test User',
    };

    const profile = ProfileSchema.parse(data);

    expect(profile.key).toBe('user123');
    expect(profile.username).toBe('testuser');
    expect(profile.nick).toBe('Test User');
    expect(profile.avatarURL).toBeUndefined();
    expect(profile.bio).toBeUndefined();
    expect(profile.tags).toBeUndefined();
    expect(profile.lovedThreads).toBeUndefined();
  });
});

describe('parseProfile', () => {
  it('should parse profile data with defaults', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
    };

    const profile = parseProfile(data, 'user123');

    expect(profile.key).toBe('user123');
    expect(profile.username).toBe('testuser');
    expect(profile.nick).toBe('Test User');
  });

  it('should generate username from nick if missing', () => {
    const data = {
      nick: 'Test User',
    };

    const profile = parseProfile(data, 'user123');

    expect(profile.key).toBe('user123');
    expect(profile.username).toBeTruthy();
    expect(profile.nick).toBe('Test User');
  });

  it('should default nick to N.N. if missing', () => {
    const data = {};

    const profile = parseProfile(data, 'user123');

    expect(profile.key).toBe('user123');
    expect(profile.nick).toBe('N.N.');
    expect(profile.username).toBeTruthy();
  });
});

describe('migrateProfile', () => {
  it('should migrate legacy photoURL to avatarURL', () => {
    const legacyData = {
      nick: 'Test User',
      username: 'testuser',
      photoURL: 'https://example.com/old-photo.jpg',
    };

    const profile = migrateProfile(legacyData, 'user123');

    expect(profile.key).toBe('user123');
    expect(profile.username).toBe('testuser');
    expect(profile.nick).toBe('Test User');
    expect(profile.avatarURL).toBe('https://example.com/old-photo.jpg');
  });

  it('should prefer avatarURL over photoURL', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      avatarURL: 'https://example.com/new-avatar.jpg',
      photoURL: 'https://example.com/old-photo.jpg',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.avatarURL).toBe('https://example.com/new-avatar.jpg');
  });

  it('should handle missing nick with default', () => {
    const data = {
      username: 'testuser',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.nick).toBe('N.N.');
    expect(profile.username).toBe('testuser');
  });

  it('should generate username from nick if missing', () => {
    const data = {
      nick: 'Test User',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.username).toBeTruthy();
    expect(profile.nick).toBe('Test User');
  });

  it('should filter invalid tags from arrays', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      tags: ['valid', 123, 'another', null, 'third'],
      lovedThreads: ['thread1', false, 'thread2', undefined, 'thread3'],
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.tags).toEqual(['valid', 'another', 'third']);
    expect(profile.lovedThreads).toEqual(['thread1', 'thread2', 'thread3']);
  });

  it('should handle non-array tags and lovedThreads', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      tags: 'not-an-array',
      lovedThreads: { invalid: 'object' },
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.tags).toBeUndefined();
    expect(profile.lovedThreads).toBeUndefined();
  });

  it('should not include empty arrays as optional fields', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      tags: [],
      lovedThreads: [],
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.tags).toBeUndefined();
    expect(profile.lovedThreads).toBeUndefined();
  });

  it('should preserve bio field if present', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      bio: 'This is my bio',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.bio).toBe('This is my bio');
  });

  it('should handle non-string bio', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      bio: 12345,
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.bio).toBeUndefined();
  });

  it('should handle empty avatarURL', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      avatarURL: '',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.avatarURL).toBeUndefined();
  });

  it('should throw error for non-object data', () => {
    expect(() =>
      migrateProfile(
        'not an object' as unknown as Record<string, unknown>,
        'user123',
      ),
    ).toThrow('Invalid profile data');
  });

  it('should migrate complete legacy profile', () => {
    const legacyData = {
      nick: 'Legacy User',
      photoURL: 'https://example.com/legacy.jpg',
      bio: 'Old profile bio',
      tags: ['tag1', 'tag2'],
      lovedThreads: ['thread1'],
    };

    const profile = migrateProfile(legacyData, 'legacy-user-id');

    expect(profile.key).toBe('legacy-user-id');
    expect(profile.nick).toBe('Legacy User');
    expect(profile.username).toBeTruthy();
    expect(profile.avatarURL).toBe('https://example.com/legacy.jpg');
    expect(profile.bio).toBe('Old profile bio');
    expect(profile.tags).toEqual(['tag1', 'tag2']);
    expect(profile.lovedThreads).toEqual(['thread1']);
  });

  it('should handle type coercion for nick', () => {
    const data = {
      nick: 123,
      username: 'testuser',
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.nick).toBe('123');
  });

  it('should handle type coercion for username', () => {
    const data = {
      nick: 'Test User',
      username: 456,
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.username).toBe('456');
  });

  it('should handle type coercion for avatarURL', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      avatarURL: 12345,
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.avatarURL).toBe('12345');
  });

  it('should migrate valid links', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      links: [
        { url: 'https://example.com', label: 'My Site' },
        { url: 'https://itch.io/me', label: 'Itch' },
      ],
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.links).toHaveLength(2);
    expect(profile.links?.[0]).toEqual({
      url: 'https://example.com',
      label: 'My Site',
    });
    expect(profile.links?.[1]).toEqual({
      url: 'https://itch.io/me',
      label: 'Itch',
    });
  });

  it('should filter invalid links during migration', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      links: [
        { url: 'https://valid.com', label: 'Valid' },
        { url: 'not-a-url', label: 'Invalid URL' }, // Invalid URL
        { url: 'https://ok.com', label: '' }, // Empty label (schema requires min 1)
        { nothing: 'here' }, // Missing fields
        'not-an-object', // Wrong type
      ],
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.links).toHaveLength(1);
    expect(profile.links?.[0]).toEqual({
      url: 'https://valid.com',
      label: 'Valid',
    });
  });

  it('should ignore empty links array in migration', () => {
    const data = {
      nick: 'Test User',
      username: 'testuser',
      links: [],
    };

    const profile = migrateProfile(data, 'user123');

    expect(profile.links).toBeUndefined();
  });
});
