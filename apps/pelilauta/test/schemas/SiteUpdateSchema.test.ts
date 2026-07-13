import { describe, expect, it } from 'vitest';
import {
  type SiteUpdate,
  SiteUpdateSchema,
} from '../../src/schemas/SiteSchema';

describe('SiteUpdateSchema', () => {
  describe('valid updates', () => {
    it('should accept empty update object', () => {
      const update = {};
      const result = SiteUpdateSchema.parse(update);
      expect(result).toEqual({});
    });

    it('should accept core field updates', () => {
      const update: SiteUpdate = {
        name: 'Updated Site Name',
        system: 'D&D 5e',
        description: 'A new description',
        homepage: 'intro',
        license: 'cc-by',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.name).toBe('Updated Site Name');
      expect(result.system).toBe('D&D 5e');
      expect(result.description).toBe('A new description');
      expect(result.homepage).toBe('intro');
      expect(result.license).toBe('cc-by');
    });

    it('should accept media field updates', () => {
      const update: SiteUpdate = {
        posterURL: 'https://example.com/poster.jpg',
        avatarURL: 'https://example.com/avatar.png',
        backgroundURL: 'https://example.com/bg.jpg',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.posterURL).toBe('https://example.com/poster.jpg');
      expect(result.avatarURL).toBe('https://example.com/avatar.png');
      expect(result.backgroundURL).toBe('https://example.com/bg.jpg');
    });

    it('should accept visibility updates', () => {
      const update: SiteUpdate = {
        hidden: false,
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.hidden).toBe(false);
    });

    it('should accept valid sortOrder values', () => {
      const orders: Array<'name' | 'createdAt' | 'flowTime' | 'manual'> = [
        'name',
        'createdAt',
        'flowTime',
        'manual',
      ];

      for (const order of orders) {
        const update: SiteUpdate = { sortOrder: order };
        const result = SiteUpdateSchema.parse(update);
        expect(result.sortOrder).toBe(order);
      }
    });

    it('should accept page organization updates', () => {
      const update: SiteUpdate = {
        sortOrder: 'manual',
        customPageKeys: true,
        usePlainTextURLs: false,
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.sortOrder).toBe('manual');
      expect(result.customPageKeys).toBe(true);
      expect(result.usePlainTextURLs).toBe(false);
    });

    it('should accept pageRefs array', () => {
      const update: SiteUpdate = {
        pageRefs: [
          {
            key: 'page1',
            name: 'Page 1',
            author: 'user123',
            flowTime: 1234567890,
          },
          {
            key: 'page2',
            name: 'Page 2',
            author: 'user456',
            category: 'rules',
            flowTime: 1234567900,
          },
        ],
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.pageRefs).toHaveLength(2);
      expect(result.pageRefs?.[0].key).toBe('page1');
      expect(result.pageRefs?.[1].category).toBe('rules');
    });

    it('should accept pageCategories array', () => {
      const update: SiteUpdate = {
        pageCategories: [
          { slug: 'rules', name: 'Rules' },
          { slug: 'lore', name: 'Lore' },
        ],
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.pageCategories).toHaveLength(2);
      expect(result.pageCategories?.[0].slug).toBe('rules');
      expect(result.pageCategories?.[1].name).toBe('Lore');
    });

    it('should accept feature toggle updates', () => {
      const update: SiteUpdate = {
        usePlayers: true,
        useClocks: false,
        useHandouts: true,
        useRecentChanges: false,
        useSidebar: true,
        useCharacters: true,
        useCharacterKeeper: false,
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.usePlayers).toBe(true);
      expect(result.useClocks).toBe(false);
      expect(result.useHandouts).toBe(true);
      expect(result.useRecentChanges).toBe(false);
      expect(result.useSidebar).toBe(true);
      expect(result.useCharacters).toBe(true);
      expect(result.useCharacterKeeper).toBe(false);
    });

    it('should accept players array', () => {
      const update: SiteUpdate = {
        players: ['user123', 'user456', 'user789'],
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.players).toEqual(['user123', 'user456', 'user789']);
    });

    it('should accept assets array', () => {
      const update: SiteUpdate = {
        assets: [
          {
            url: 'https://example.com/image1.png',
            name: 'image1.png',
            description: 'First image',
            license: 'cc-by',
          },
          {
            url: 'https://example.com/image2.jpg',
            name: 'image2.jpg',
            description: '',
            license: '0',
          },
        ],
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.assets).toHaveLength(2);
      expect(result.assets?.[0].url).toBe('https://example.com/image1.png');
    });

    it('should accept sidebar configuration', () => {
      const update: SiteUpdate = {
        useSidebar: true,
        sidebarKey: 'sidebar-page',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.useSidebar).toBe(true);
      expect(result.sidebarKey).toBe('sidebar-page');
    });

    it('should accept character keeper configuration', () => {
      const update: SiteUpdate = {
        useCharacterKeeper: true,
        characterKeeperSheetKey: 'sheet-template-1',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.useCharacterKeeper).toBe(true);
      expect(result.characterKeeperSheetKey).toBe('sheet-template-1');
    });

    it('should accept combined updates from different sections', () => {
      const update: SiteUpdate = {
        name: 'My Campaign',
        system: 'Pathfinder',
        hidden: false,
        sortOrder: 'manual',
        usePlayers: true,
        players: ['gm', 'player1', 'player2'],
        useClocks: true,
        useSidebar: true,
        sidebarKey: 'welcome',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.name).toBe('My Campaign');
      expect(result.players).toHaveLength(3);
      expect(result.useClocks).toBe(true);
    });
  });

  describe('invalid updates', () => {
    it('should reject invalid sortOrder', () => {
      const update = {
        sortOrder: 'invalid-order',
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject non-string name', () => {
      const update = {
        name: 123,
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject non-boolean hidden', () => {
      const update = {
        hidden: 'true',
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject invalid pageRefs structure', () => {
      const update = {
        pageRefs: [
          {
            // Missing required 'key' field
            name: 'Page 1',
            author: 'user123',
            flowTime: 1234567890,
          },
        ],
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject invalid pageCategories structure', () => {
      const update = {
        pageCategories: [
          {
            // Missing required 'name' field
            slug: 'rules',
          },
        ],
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject non-array players', () => {
      const update = {
        players: 'user123',
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject players array with non-string elements', () => {
      const update = {
        players: ['user123', 456, 'user789'],
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject invalid assets', () => {
      const update = {
        assets: [
          {
            // Missing required 'url' field
            name: 'image.png',
            description: 'An image',
            license: 'cc-by',
          },
        ],
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });

    it('should reject non-boolean feature toggles', () => {
      const update = {
        usePlayers: 'yes',
      };

      expect(() => SiteUpdateSchema.parse(update)).toThrow();
    });
  });

  describe('does not include Entry fields', () => {
    it('should not validate key field', () => {
      // key should not be in update schema - it comes from URL params
      const updateWithKey = {
        name: 'Test Site',
        key: 'should-be-ignored',
      };

      const result = SiteUpdateSchema.parse(updateWithKey);
      // Zod will strip unknown fields unless passthrough() is used
      expect(result).not.toHaveProperty('key');
    });

    it('should not validate owners field', () => {
      // owners should not be updatable via API
      const updateWithOwners = {
        name: 'Test Site',
        owners: ['user123'],
      };

      const result = SiteUpdateSchema.parse(updateWithOwners);
      expect(result).not.toHaveProperty('owners');
    });

    it('should not validate timestamp fields', () => {
      // createdAt, updatedAt, flowTime are managed by toFirestoreEntry
      const updateWithTimestamps = {
        name: 'Test Site',
        createdAt: new Date(),
        updatedAt: new Date(),
        flowTime: 1234567890,
      };

      const result = SiteUpdateSchema.parse(updateWithTimestamps);
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('flowTime');
    });
  });

  describe('partial updates', () => {
    it('should allow updating only name', () => {
      const update: SiteUpdate = {
        name: 'New Name Only',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.name).toBe('New Name Only');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should allow updating only visibility', () => {
      const update: SiteUpdate = {
        hidden: true,
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.hidden).toBe(true);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should allow updating only feature toggles', () => {
      const update: SiteUpdate = {
        useClocks: true,
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.useClocks).toBe(true);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should allow clearing optional string fields', () => {
      const update: SiteUpdate = {
        description: '',
        posterURL: '',
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.description).toBe('');
      expect(result.posterURL).toBe('');
    });

    it('should allow clearing optional array fields', () => {
      const update: SiteUpdate = {
        players: [],
        assets: [],
        pageRefs: [],
        pageCategories: [],
      };

      const result = SiteUpdateSchema.parse(update);
      expect(result.players).toEqual([]);
      expect(result.assets).toEqual([]);
      expect(result.pageRefs).toEqual([]);
      expect(result.pageCategories).toEqual([]);
    });
  });

  describe('type safety', () => {
    it('should enforce SiteUpdate type', () => {
      // This is a compile-time test that verifies the type is correct
      const validUpdate: SiteUpdate = {
        name: 'Test',
        hidden: false,
        sortOrder: 'manual',
      };

      expect(validUpdate.name).toBe('Test');
    });

    it('should allow all optional fields to be undefined', () => {
      const update: SiteUpdate = {};
      const result = SiteUpdateSchema.parse(update);
      expect(result).toEqual({});
    });
  });
});
