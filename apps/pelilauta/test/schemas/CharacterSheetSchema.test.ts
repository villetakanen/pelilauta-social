import { describe, expect, it } from 'vitest';
import {
  CharacterSheetSchema,
  CharacterStatSchema,
  migrateCharacterSheet,
} from '../../src/schemas/CharacterSheetSchema';

describe('CharacterStatSchema', () => {
  it('should validate a number stat correctly', () => {
    const stat = {
      type: 'number',
      key: 'strength',
      value: 18,
      description: 'Physical might',
      group: 'Attributes',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(true);
  });

  it('should use default value for a number stat if value is missing', () => {
    const stat = {
      type: 'number',
      key: 'dexterity',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === 'number') {
      expect(result.data.value).toBe(0);
    }
  });

  it('should validate a toggled stat correctly', () => {
    const stat = {
      type: 'toggled',
      key: 'is_proficient',
      value: true,
      group: 'Skills',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(true);
  });

  it('should use default value for a toggled stat if value is missing', () => {
    const stat = {
      type: 'toggled',
      key: 'has_advantage',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === 'toggled') {
      expect(result.data.value).toBe(false);
    }
  });

  it('should validate a derived stat correctly', () => {
    const stat = {
      type: 'derived',
      key: 'strength_modifier',
      formula: 'floor((@strength - 10) / 2)',
      group: 'Modifiers',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(true);
  });

  it('should fail validation if key is empty', () => {
    const stat = {
      type: 'number',
      key: '',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(false);
  });

  it('should fail validation for an unknown type', () => {
    const stat = {
      type: 'atext',
      key: 'name',
      value: 'John Doe',
    };
    const result = CharacterStatSchema.safeParse(stat);
    expect(result.success).toBe(false);
  });
});

describe('CharacterSheetSchema', () => {
  it('should validate a basic character sheet', () => {
    const sheet = {
      key: 'dnd5e-basic',
      name: 'D&D 5e Basic',
      system: 'dnd5e',
      stats: [
        { type: 'number', key: 'strength', value: 10 },
        { type: 'toggled', key: 'inspiration', value: false },
        {
          type: 'derived',
          key: 'proficiency_bonus',
          formula: 'ceil(1 + (@level / 4))',
        },
      ],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(true);
  });

  it('should validate a character sheet with an empty stats array', () => {
    const sheet = {
      key: 'empty-sheet',
      name: 'Empty Sheet',
      system: 'generic',
      stats: [],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stats).toEqual([]);
    }
  });

  it('should fail if name is missing', () => {
    const sheet = {
      key: 'no-name-sheet',
      system: 'generic',
      stats: [],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
  });

  it('should fail if system is missing', () => {
    const sheet = {
      key: 'no-system-sheet',
      name: 'No System',
      stats: [],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
  });

  it('should fail if key is missing', () => {
    const sheet = {
      name: 'No Key',
      system: 'generic',
      stats: [],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
  });

  it('should fail if stats array contains an invalid stat', () => {
    const sheet = {
      key: 'invalid-stat-sheet',
      name: 'Invalid Stat Sheet',
      system: 'generic',
      stats: [
        { type: 'number', key: 'valid_stat', value: 10 },
        { type: 'invalid_type', key: 'invalid_stat' },
      ],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
  });

  it('should validate a character sheet with StatGroup objects', () => {
    const sheet = {
      key: 'modern-sheet',
      name: 'Modern Sheet with StatGroups',
      system: 'dnd5e',
      statGroups: [
        { key: 'Attributes', layout: 'grid-2' },
        { key: 'Skills', layout: 'rows' },
        { key: 'Combat', layout: 'grid-3' },
      ],
      stats: [
        { type: 'number', key: 'strength', value: 10, group: 'Attributes' },
        { type: 'number', key: 'acrobatics', value: 5, group: 'Skills' },
      ],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.statGroups).toHaveLength(3);
      expect(result.data.statGroups[0].key).toBe('Attributes');
      expect(result.data.statGroups[0].layout).toBe('grid-2');
    }
  });

  it('should use default layout for StatGroup if not specified', () => {
    const sheet = {
      key: 'default-layout-sheet',
      name: 'Default Layout Sheet',
      system: 'generic',
      statGroups: [{ key: 'Stats' }],
      stats: [],
    };
    const result = CharacterSheetSchema.safeParse(sheet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.statGroups[0].layout).toBe('rows');
    }
  });
});

describe('migrateCharacterSheet', () => {
  it('should migrate string-based stat groups to StatGroup objects', () => {
    const oldSheet = {
      key: 'legacy-sheet',
      name: 'Legacy Sheet',
      system: 'dnd5e',
      statGroups: ['Attributes', 'Skills', 'Combat'],
      stats: [
        { type: 'number', key: 'strength', value: 10, group: 'Attributes' },
        { type: 'number', key: 'acrobatics', value: 5, group: 'Skills' },
      ],
    };

    const migratedSheet = migrateCharacterSheet(oldSheet);

    expect(migratedSheet.statGroups).toHaveLength(3);
    expect(migratedSheet.statGroups[0]).toEqual({
      key: 'Attributes',
      layout: 'rows',
    });
    expect(migratedSheet.statGroups[1]).toEqual({
      key: 'Skills',
      layout: 'rows',
    });
    expect(migratedSheet.statGroups[2]).toEqual({
      key: 'Combat',
      layout: 'rows',
    });
  });

  it('should not modify already migrated StatGroup objects', () => {
    const modernSheet = {
      key: 'modern-sheet',
      name: 'Modern Sheet',
      system: 'dnd5e',
      statGroups: [
        { key: 'Attributes', layout: 'grid-2' },
        { key: 'Skills', layout: 'rows' },
      ],
      stats: [],
    };

    const result = migrateCharacterSheet(modernSheet);

    expect(result.statGroups).toHaveLength(2);
    expect(result.statGroups[0]).toEqual({
      key: 'Attributes',
      layout: 'grid-2',
    });
    expect(result.statGroups[1]).toEqual({
      key: 'Skills',
      layout: 'rows',
    });
  });

  it('should handle empty statGroups array', () => {
    const sheet = {
      key: 'empty-groups-sheet',
      name: 'Empty Groups Sheet',
      system: 'generic',
      statGroups: [],
      stats: [],
    };

    const result = migrateCharacterSheet(sheet);
    expect(result.statGroups).toEqual([]);
  });

  it('should throw error for invalid sheet data', () => {
    expect(() => migrateCharacterSheet(null)).toThrow(
      'Invalid character sheet data',
    );
    expect(() => migrateCharacterSheet('not an object')).toThrow(
      'Invalid character sheet data',
    );
  });
});
