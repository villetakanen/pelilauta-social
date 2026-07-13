import { describe, expect, it } from 'vitest';
import { CharacterSchema } from '../../src/schemas/CharacterSchema';

describe('CharacterSchema', () => {
  const basicCharacter = {
    key: 'char-123',
    name: 'Aragorn',
    description: 'Heir of Isildur',
    avatar: 'https://example.com/aragorn.png',
    owners: ['user-1'],
  };

  it('should validate a basic character without a sheetKey or stats', () => {
    const result = CharacterSchema.safeParse(basicCharacter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stats).toEqual({});
    }
  });

  it('should validate a character with only the required fields', () => {
    const minimalCharacter = {
      name: 'Legolas',
      owners: [],
    };
    const result = CharacterSchema.safeParse(minimalCharacter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.owners).toEqual([]);
      expect(result.data.stats).toEqual({});
    }
  });

  it('should validate a character with a sheetKey and stats', () => {
    const characterWithSheetKey = {
      ...basicCharacter,
      sheetKey: 'dnd5e-fighter',
      stats: {
        strength: 16,
        second_wind_used: false,
      },
    };
    const result = CharacterSchema.safeParse(characterWithSheetKey);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sheetKey).toBe('dnd5e-fighter');
      expect(result.data.stats).toEqual({
        strength: 16,
        second_wind_used: false,
      });
    }
  });

  it('should fail if the name is empty', () => {
    const invalidCharacter = { ...basicCharacter, name: '' };
    const result = CharacterSchema.safeParse(invalidCharacter);
    expect(result.success).toBe(false);
  });

  it('should fail if the avatar URL is invalid', () => {
    const invalidCharacter = { ...basicCharacter, avatar: 'not-a-url' };
    const result = CharacterSchema.safeParse(invalidCharacter);
    expect(result.success).toBe(false);
  });

  it('should fail if stats are not a record of string, number or boolean', () => {
    const characterWithInvalidStats = {
      ...basicCharacter,
      stats: {
        strength: { value: 16 }, // Invalid stat value
      },
    };
    const result = CharacterSchema.safeParse(characterWithInvalidStats);
    expect(result.success).toBe(false);
  });
});
