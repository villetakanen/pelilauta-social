import { z } from 'zod';

export const CHARACTER_SHEETS_COLLECTION_NAME = 'charsheets';

/**
 * Schema for a stat group that defines how stats are visually organized.
 * Each group has a key (name) and a layout type for the cn-stat-block component.
 */
const StatGroupSchema = z.object({
  key: z.string().min(1, 'StatGroup key cannot be empty'),
  layout: z.enum(['rows', 'grid-2', 'grid-3']).default('rows'),
});

export type StatGroup = z.infer<typeof StatGroupSchema>;

/**
 * The base schema for any type of character stat.
 * It includes common properties like key, description, and group.
 */
const StatBaseSchema = z.object({
  key: z
    .string()
    .min(1, 'Key cannot be empty')
    .describe(
      'Unique identifier for the stat, e.g., "strength" or "hit_points".',
    ),
  description: z
    .string()
    .optional()
    .describe(
      'Optional description for the stat, e.g., "Measures physical power".',
    ),
  group: z
    .string()
    .optional()
    .describe(
      'Optional group name for organizing stats in the UI, e.g., "Attributes".',
    ),
  value: z.any().optional().describe('The value of the stat.'),
});

/**
 * Schema for a stat that holds a numeric value.
 */
const NumberStatSchema = StatBaseSchema.extend({
  type: z.literal('number'),
  value: z.number().default(0).describe('The numeric value of the stat.'),
});

/**
 * Schema for a stat that can be toggled on or off.
 */
const ToggledStatSchema = StatBaseSchema.extend({
  type: z.literal('toggled'),
  value: z.coerce
    .boolean()
    .default(false)
    .describe('The boolean state of the stat.'),
});

/**
 * Schema for a stat that is defined by the D20 Ability Score system.
 * It includes a "base value" and a "modifier".
 *
 * For schema purposes, the "base value" is a descriptive field, while the
 * "modifier" is a numeric value, as in "number" type stats.
 */
const D20AbilityScoreSchema = StatBaseSchema.extend({
  type: z.literal('d20_ability_score'),
  baseValue: z
    .number()
    .default(10)
    .describe('The descriptive base value of the ability score, e.g., "10".'),
  value: z
    .number()
    .default(0)
    .describe(
      'The numeric modifier for the ability score, e.g., +3 for Strength.',
    ),
  hasProficiency: z
    .boolean()
    .default(false)
    .describe(
      'Whether this ability score supports proficiency bonuses (e.g., for saving throws).',
    ),
}).describe(
  'A stat that represents a D20 Ability Score, such as Strength or Dexterity, with a base value and a modifier.',
);

/**
 * Schema for a stat whose value is derived from a formula.
 * The formula can reference other stats using the "@key" notation.
 */
const DerivedStatSchema = StatBaseSchema.extend({
  type: z.literal('derived'),
  formula: z
    .string()
    .describe(
      'The formula to calculate the value, e.g., "@strength_modifier + @proficiency_bonus".',
    ),
});

/**
 * Schema for a stat whose value is derived from a formula.
 * The formula can reference other stats using the "@key" notation.
 */
const TextStatSchema = StatBaseSchema.extend({
  type: z.literal('text'),
  // Make text value optional with a safe default so sheets without an
  // explicit value won't fail validation. This mirrors other schemas that
  // provide defaults (number -> 0, toggled -> false).
  value: z.string().default('').describe('The text value of the stat.'),
});

/**
 * A discriminated union of all possible stat types.
 * This allows for flexible and type-safe handling of different kinds of stats.
 */
export const CharacterStatSchema = z.discriminatedUnion('type', [
  NumberStatSchema,
  ToggledStatSchema,
  DerivedStatSchema,
  D20AbilityScoreSchema,
  TextStatSchema,
]);

/**
 * The TypeScript type inferred from the CharacterStatSchema.
 * Use this type in your application code.
 */
export type CharacterStat = z.infer<typeof CharacterStatSchema>;

/**
 * A CharacterSheet is a template for creating characters for a specific game system.
 * It defines the structure of the character's stats.
 */
export const CharacterSheetSchema = z
  .object({
    key: z
      .string()
      .min(1, 'Key cannot be empty')
      .describe('Unique identifier for the character sheet template.'),
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .describe(
        'Name of the character sheet template, e.g., "D&D 5e" or "FATE Core".',
      ),
    system: z
      .string()
      .min(1, 'System cannot be empty')
      .describe(
        'The roleplaying game system this sheet is for, e.g., "dnd5e".',
      ),
    statGroups: z.array(StatGroupSchema).default([]),
    stats: z
      .array(CharacterStatSchema)
      .default([])
      .describe('The list of stat templates that make up this sheet.'),
  })
  .describe('A template for creating player characters.');

export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;

/**
 * Migration function to convert existing character sheets with string-based stat groups
 * to the new StatGroup object format with layout properties.
 */
export function migrateCharacterSheet(sheet: unknown): CharacterSheet {
  // Ensure sheet is an object
  if (typeof sheet !== 'object' || sheet === null) {
    throw new Error('Invalid character sheet data');
  }

  const sheetData = sheet as Record<string, unknown>;

  // Handle the migration of statGroups from string[] to StatGroup[]
  if (Array.isArray(sheetData.statGroups) && sheetData.statGroups.length > 0) {
    // Check if first element is string (old format)
    if (typeof sheetData.statGroups[0] === 'string') {
      sheetData.statGroups = (sheetData.statGroups as string[]).map(
        (groupName: string) => ({
          key: groupName,
          layout: 'rows' as const,
        }),
      );
    }
  }

  return CharacterSheetSchema.parse(sheetData);
}
