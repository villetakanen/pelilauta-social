import { z } from 'zod';

/**
 * This schema defines the structure of a standard entry in the app database.
 * It includes fields for the document ID, creation time, update time, and owners.
 * The `createdAt` and `updatedAt` fields are expected to be converted to Firestore
 * timestamps at save time and to client Date objects at load time.
 *
 */
export const EntrySchema = z.object({
  // This is the firestore document ID. New entries will have an empty string as the ID
  key: z.string().default(''),

  // Creation time of the entry. This will be converted intoa Firestore timestamp
  // for Firestore
  createdAt: z.coerce.date().optional(),

  // Update time of the entry. This will be converted intoa Firestore timestamp
  // for Firestore
  updatedAt: z.coerce.date().optional(),

  // Flow time is a number that represents the time of the entry in a stream of
  // entries. It is used for sorting and ordering entries in a stream.
  flowTime: z.coerce.number().default(0),

  // Array of uid strings that represent the owners of the entry, for Authz purposes.
  owners: z.array(z.string()).default([]),
});

export type Entry = z.infer<typeof EntrySchema>;
