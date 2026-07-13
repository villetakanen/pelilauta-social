import { z } from 'zod';
import { ContentEntrySchema } from './ContentEntry';

export const CHARACTERS_COLLECTION_NAME = 'characters';

/**
 * The schema for a player character.
 * This is a specific type of Entry in the database.
 */
export const CharacterSchema = ContentEntrySchema.extend({
  /** The name of the character. */
  name: z.string().min(1, 'Character name cannot be empty.'),

  /** A public-facing summary or description of the character. */
  description: z.string().optional(),

  /** The key of the site this character belongs to. */
  siteKey: z.string().optional(),

  /** Reference to a character sheet template by key. */
  sheetKey: z.string().optional(),

  /** The key of the system this character belongs to. Used for
   * loading system-specific character sheets etc.
   */
  systemKey: z.string().optional(),

  /** Character stats as key-value pairs. Values can be string, number, or boolean. */
  stats: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),

  /** URL for the character's avatar image. */
  avatar: z.url().optional(),
}).describe('A player character entry.');

export type Character = z.infer<typeof CharacterSchema>;
