import { describe, expect, test } from 'vitest';
import {
  createSite,
  migrateLegacySiteFields,
  PageRefSchema,
  type Site,
  SiteSchema,
} from '../../src/schemas/SiteSchema';

describe('createSite', () => {
  test('creates a site with minimal data', () => {
    const site = createSite({ key: 'test-site' });

    expect(site.key).toBe('test-site');
    expect(site.name).toBe('[...]'); // Default value
    expect(site.system).toBe('homebrew'); // Default value
    expect(site.hidden).toBe(false); // Default value
    expect(site.sortOrder).toBe('name'); // Default value
    expect(site.license).toBe('0'); // Default value
    expect(site.useSidebar).toBe(true); // Default value
    expect(site.owners).toEqual([]); // Default from EntrySchema
  });

  test('creates a site with no arguments', () => {
    const site = createSite();

    expect(site.key).toBe('');
    expect(site.name).toBe('[...]');
    expect(site.system).toBe('homebrew');
    expect(site.hidden).toBe(false);
    expect(site.sortOrder).toBe('name');
    expect(site.license).toBe('0');
    expect(site.useSidebar).toBe(true);
  });

  test('creates a site with custom values', () => {
    const site = createSite({
      key: 'my-campaign',
      name: 'My Epic Campaign',
      system: 'dnd5e',
      hidden: true,
      sortOrder: 'manual',
      license: 'CC-BY-4.0',
      useSidebar: false,
      owners: ['user123'],
    });

    expect(site.key).toBe('my-campaign');
    expect(site.name).toBe('My Epic Campaign');
    expect(site.system).toBe('dnd5e');
    expect(site.hidden).toBe(true);
    expect(site.sortOrder).toBe('manual');
    expect(site.license).toBe('CC-BY-4.0');
    expect(site.useSidebar).toBe(false);
    expect(site.owners).toEqual(['user123']);
  });

  test('allows partial overrides of defaults', () => {
    const site = createSite({
      name: 'Partial Site',
      system: 'fate',
    });

    expect(site.name).toBe('Partial Site');
    expect(site.system).toBe('fate');
    // Other defaults still apply
    expect(site.hidden).toBe(false);
    expect(site.sortOrder).toBe('name');
  });

  // Entry field tests - following EntrySchema patterns
  describe('Entry field defaults (following Entry pattern)', () => {
    test('uses default values for key, flowTime, and owners if not provided', () => {
      const site = createSite({ name: 'Test Site' });

      // EntrySchema defaults
      expect(site.key).toBe(''); // Default empty string
      expect(site.flowTime).toBe(0); // Default 0
      expect(site.owners).toEqual([]); // Default empty array
      expect(site.createdAt).toBeUndefined();
      expect(site.updatedAt).toBeUndefined();
    });

    test('respects provided key, flowTime, and owners', () => {
      const customFlowTime = 1234567890;
      const site = createSite({
        key: 'custom-key',
        flowTime: customFlowTime,
        owners: ['user1', 'user2'],
      });

      expect(site.key).toBe('custom-key');
      expect(site.flowTime).toBe(customFlowTime);
      expect(site.owners).toEqual(['user1', 'user2']);
    });

    test('correctly parses Date objects for createdAt and updatedAt', () => {
      const createdDate = new Date('2024-01-15T10:00:00Z');
      const updatedDate = new Date('2024-01-16T12:30:00Z');

      const site = createSite({
        name: 'Test Site',
        createdAt: createdDate,
        updatedAt: updatedDate,
      });

      expect(site.createdAt).toEqual(createdDate);
      expect(site.updatedAt).toEqual(updatedDate);
    });

    test('correctly parses string dates for createdAt and updatedAt', () => {
      // Test that Zod's z.coerce.date() handles string dates
      const site = createSite({
        name: 'Test Site',
        createdAt: '2024-02-20T08:00:00.000Z' as unknown as Date,
        updatedAt: '2024-02-21T09:30:00.000Z' as unknown as Date,
      });

      expect(site.createdAt).toEqual(new Date('2024-02-20T08:00:00.000Z'));
      expect(site.updatedAt).toEqual(new Date('2024-02-21T09:30:00.000Z'));
    });

    test('allows createdAt and updatedAt to be undefined', () => {
      const site = createSite({
        name: 'Test Site',
        key: 'no-dates',
        flowTime: 100,
      });

      expect(site.createdAt).toBeUndefined();
      expect(site.updatedAt).toBeUndefined();
    });

    test('correctly coerces numeric string for flowTime', () => {
      // Test that Zod's z.coerce.number() handles numeric strings
      const site = createSite({
        name: 'Test Site',
        flowTime: '12345' as unknown as number,
      });

      expect(site.flowTime).toBe(12345);
    });

    test('accepts an empty owners array', () => {
      const site = createSite({
        name: 'Test Site',
        owners: [],
      });

      expect(site.owners).toEqual([]);
    });

    test('validates with all Entry and Site fields provided', () => {
      const site = createSite({
        // Entry fields
        key: 'full-site',
        flowTime: 9999,
        owners: ['owner1', 'owner2'],
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T12:30:00Z'),
        // Site-specific fields
        name: 'Full Site',
        system: 'pbta',
        hidden: true,
        sortOrder: 'createdAt',
        license: 'MIT',
        useSidebar: false,
        description: 'A test site',
        homepage: 'main',
        posterURL: 'https://example.com/poster.jpg',
      });

      // Entry fields
      expect(site.key).toBe('full-site');
      expect(site.flowTime).toBe(9999);
      expect(site.owners).toEqual(['owner1', 'owner2']);
      expect(site.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(site.updatedAt).toEqual(new Date('2024-01-16T12:30:00Z'));
      // Site fields
      expect(site.name).toBe('Full Site');
      expect(site.system).toBe('pbta');
      expect(site.hidden).toBe(true);
    });

    test('toFirestoreEntry sets author from owners[0]', async () => {
      // Create a site with owners but no author
      const site = createSite({
        name: 'Test Site',
        owners: ['alice', 'bob'],
      });

      // Import toFirestoreEntry to test the behavior
      const { toFirestoreEntry } = await import(
        '../../src/utils/client/toFirestoreEntry'
      );

      const firestoreData = toFirestoreEntry(site);

      // Verify author is set to first owner
      expect(firestoreData.author).toBe('alice');
      expect(firestoreData.owners).toEqual(['alice', 'bob']);
    });

    test('toFirestoreEntry respects explicit author', async () => {
      // Create a site and explicitly set author (via ContentEntry cast)
      const site = createSite({
        name: 'Test Site',
        owners: ['alice', 'bob'],
      });

      const { toFirestoreEntry } = await import(
        '../../src/utils/client/toFirestoreEntry'
      );

      // Explicitly set author in the data passed to toFirestoreEntry
      const firestoreData = toFirestoreEntry({
        ...site,
        author: 'charlie',
      });

      // Verify explicit author is preserved
      expect(firestoreData.author).toBe('charlie');
      expect(firestoreData.owners).toEqual(['alice', 'bob']);
    });

    test('toFirestoreEntry uses dash when no owners', async () => {
      const site = createSite({
        name: 'Test Site',
        owners: [],
      });

      const { toFirestoreEntry } = await import(
        '../../src/utils/client/toFirestoreEntry'
      );

      const firestoreData = toFirestoreEntry(site);

      // Verify author defaults to '-' when no owners
      expect(firestoreData.author).toBe('-');
      expect(firestoreData.owners).toEqual([]);
    });
  });
});

describe('migrateLegacySiteFields', () => {
  test('migrates customPageKeys to usePlainTextURLs', () => {
    const legacy = {
      key: 'test-site',
      customPageKeys: true,
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.usePlainTextURLs).toBe(false); // Inverted logic
  });

  test('does not override existing usePlainTextURLs', () => {
    const legacy = {
      key: 'test-site',
      customPageKeys: true,
      usePlainTextURLs: true,
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.usePlainTextURLs).toBe(true); // Keeps existing value
  });

  test('does not modify homepage field', () => {
    const legacy = {
      key: 'test-site',
      homepage: 'custom-home',
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.homepage).toBe('custom-home');
  });

  test('preserves undefined homepage', () => {
    const legacy = {
      key: 'test-site',
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.homepage).toBeUndefined();
  });

  test('migrates legacy sortOrder "created" to "createdAt"', () => {
    const legacy = {
      key: 'test-site',
      sortOrder: 'created' as unknown as 'name',
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.sortOrder).toBe('createdAt');
  });

  test('migrates legacy sortOrder "updated" to "flowTime"', () => {
    const legacy = {
      key: 'test-site',
      sortOrder: 'updated' as unknown as 'name',
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.sortOrder).toBe('flowTime');
  });

  test('preserves valid sortOrder values', () => {
    const validValues = ['name', 'createdAt', 'flowTime', 'manual'] as const;

    for (const value of validValues) {
      const legacy = {
        key: 'test-site',
        sortOrder: value,
      } as Partial<Site>;

      const migrated = migrateLegacySiteFields(legacy);

      expect(migrated.sortOrder).toBe(value);
    }
  });

  test('handles undefined sortOrder', () => {
    const legacy = {
      key: 'test-site',
    } as Partial<Site>;

    const migrated = migrateLegacySiteFields(legacy);

    expect(migrated.sortOrder).toBeUndefined();
  });
});

describe('SiteSchema defaults', () => {
  test('applies all defaults when parsing empty object', () => {
    const site = SiteSchema.parse({});

    expect(site.name).toBe('[...]');
    expect(site.system).toBe('homebrew');
    expect(site.hidden).toBe(false);
    expect(site.sortOrder).toBe('name');
    expect(site.license).toBe('0');
    expect(site.useSidebar).toBe(true);
    expect(site.key).toBe(''); // From EntrySchema
    expect(site.flowTime).toBe(0); // From EntrySchema
    expect(site.owners).toEqual([]); // From EntrySchema
  });

  test('parses site with all fields provided', () => {
    const fullSite = {
      key: 'full-site',
      name: 'Full Site',
      system: 'pbta',
      hidden: true,
      sortOrder: 'createdAt' as const,
      license: 'MIT',
      useSidebar: false,
      flowTime: 9999,
      owners: ['owner1', 'owner2'],
      description: 'A test site',
      homepage: 'main',
      posterURL: 'https://example.com/poster.jpg',
    };

    const site = SiteSchema.parse(fullSite);

    expect(site).toMatchObject(fullSite);
  });
});

describe('PageRefSchema', () => {
  test('should accept order field', () => {
    const pageRef = {
      key: 'test-page',
      name: 'Test Page',
      author: 'user123',
      flowTime: 1234567890,
      order: 5,
    };

    expect(() => PageRefSchema.parse(pageRef)).not.toThrow();
    const parsed = PageRefSchema.parse(pageRef);
    expect(parsed.order).toBe(5);
  });

  test('should allow order field to be optional', () => {
    const pageRef = {
      key: 'test-page',
      name: 'Test Page',
      author: 'user123',
      flowTime: 1234567890,
      // order field omitted
    };

    expect(() => PageRefSchema.parse(pageRef)).not.toThrow();
    const parsed = PageRefSchema.parse(pageRef);
    expect(parsed.order).toBeUndefined();
  });

  test('should accept order field with zero value', () => {
    const pageRef = {
      key: 'first-page',
      name: 'First Page',
      author: 'user123',
      flowTime: 1234567890,
      order: 0,
    };

    expect(() => PageRefSchema.parse(pageRef)).not.toThrow();
    const parsed = PageRefSchema.parse(pageRef);
    expect(parsed.order).toBe(0);
  });

  test('should reject invalid order field type', () => {
    const pageRef = {
      key: 'test-page',
      name: 'Test Page',
      author: 'user123',
      flowTime: 1234567890,
      order: 'invalid', // Should be number
    };

    expect(() => PageRefSchema.parse(pageRef)).toThrow();
  });
});
