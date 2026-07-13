import { z } from 'zod';
import { AssetSchema } from './AssetSchema';
import { EntrySchema } from './EntrySchema';

export const SITES_COLLECTION_NAME = 'sites';

/**
 * Each site has a page index. This is a list of keys that point to pages with
 * some metadata about the page, to help building the different page listings (such as index, last 3 changes, etc)
 *
 * BREAKING CHANGE: This replaces earlier (< 16.x.y) index metadata that was stored in firestore db
 */
export const PageRefSchema = z.object({
  key: z.string(),
  name: z.string(),
  author: z.string(),
  category: z.string().optional(),
  // Note: we save flowTime instead of updatedAt, as firestore
  // does not fully support timestamps in array fields
  flowTime: z.number(),
  order: z.number().optional(), // Manual sort position for TOC ordering
});

export type PageRef = z.infer<typeof PageRefSchema>;

/**
 * Breaking change: This replaces earlier (< 16.x.y) category metadata that was stored in firestore db
 * as "Categories" array in the site document
 */
export const CategoryRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export type CategoryRef = z.infer<typeof CategoryRefSchema>;

export function parseCategories(data: Partial<CategoryRef[]>): CategoryRef[] {
  return data.map((category) => {
    return CategoryRefSchema.parse(category);
  });
}

export const SiteSortOrderSchema = z.enum([
  'name',
  'createdAt',
  'flowTime',
  'manual',
]);
export type SiteSortOrder = z.infer<typeof SiteSortOrderSchema>;

export const SiteSchema = EntrySchema.extend({
  // Core fields
  name: z.string().default('[...]'),
  system: z.string().default('homebrew'),
  description: z.string().optional(),
  homepage: z.string().optional(),
  license: z.string().default('0'),

  // Visibility
  hidden: z.boolean().default(false),

  // Media/assets
  posterURL: z.string().optional(),
  avatarURL: z.string().optional(),
  backgroundURL: z.string().optional(),
  assets: z.array(AssetSchema).optional(),

  // Page organization
  sortOrder: SiteSortOrderSchema.default('name'),
  customPageKeys: z.boolean().default(false),
  usePlainTextURLs: z.boolean().default(false),
  pageRefs: z.array(PageRefSchema).optional(),
  pageCategories: z.array(CategoryRefSchema).optional(),

  // Players
  players: z.array(z.string()).optional(),
  usePlayers: z.boolean().optional(),

  // Features/options
  useClocks: z.boolean().optional(),
  useHandouts: z.boolean().optional(),
  useRecentChanges: z.boolean().optional(),
  useSidebar: z.boolean().default(true),
  sidebarKey: z.string().optional(),
  useCharacters: z.boolean().optional(),
  useCharacterKeeper: z.boolean().optional(),
  characterKeeperSheetKey: z.string().optional(),
});

export type Site = z.infer<typeof SiteSchema>;

/**
 * @deprecated Use createSite() instead. This will be removed in a future version.
 */
export const emptySite: Site = {
  key: '',
  flowTime: 0,
  name: '[...]',
  owners: [],
  hidden: true,
  sortOrder: 'name',
  system: 'homebrew',
  license: '0',
  useSidebar: true,
  customPageKeys: false,
  usePlainTextURLs: false,
};

/**
 * Schema for validating site updates via API.
 * Includes all fields from SiteSchema that can be updated by users,
 * excluding Entry fields (key, createdAt, updatedAt, flowTime, owners)
 * which are managed by toFirestoreEntry on the server.
 */
export const SiteUpdateSchema = z.object({
  // Core fields
  name: z.string().optional(),
  system: z.string().optional(),
  description: z.string().optional(),
  homepage: z.string().optional(),
  license: z.string().optional(),

  // Media/assets
  posterURL: z.string().optional(),
  avatarURL: z.string().optional(),
  backgroundURL: z.string().optional(),
  assets: z.array(AssetSchema).optional(),

  // Visibility
  hidden: z.boolean().optional(),

  // Page organization
  sortOrder: SiteSortOrderSchema.optional(),
  customPageKeys: z.boolean().optional(),
  usePlainTextURLs: z.boolean().optional(),
  pageRefs: z.array(PageRefSchema).optional(),
  pageCategories: z.array(CategoryRefSchema).optional(),

  // Features/options
  players: z.array(z.string()).optional(),
  usePlayers: z.boolean().optional(),
  useClocks: z.boolean().optional(),
  useHandouts: z.boolean().optional(),
  useRecentChanges: z.boolean().optional(),
  useSidebar: z.boolean().optional(),
  sidebarKey: z.string().optional(),
  useCharacters: z.boolean().optional(),
  useCharacterKeeper: z.boolean().optional(),
  characterKeeperSheetKey: z.string().optional(),
});

export type SiteUpdate = z.infer<typeof SiteUpdateSchema>;

/**
 * Creates a new Site object with default values.
 * Use this for creating new sites from scratch or templates.
 *
 * Entry fields (key, flowTime, owners, createdAt, updatedAt) are handled by
 * the schema defaults and should be managed by toFirestoreEntry when saving.
 *
 * @param partial - Partial site data to merge with defaults
 * @returns Valid Site object with all required fields and defaults applied
 *
 * @example
 * const site = createSite({ name: 'My Campaign' });
 */
export function createSite(partial: Partial<Site> = {}): Site {
  return SiteSchema.parse(partial);
}

/**
 * Migrates legacy site data fields to current schema.
 * Handles backwards compatibility transformations.
 *
 * @param data - Legacy site data
 * @returns Migrated site data compatible with current schema
 */
export function migrateLegacySiteFields(data: Partial<Site>): Partial<Site> {
  const migrated = { ...data };

  // Handle customPageKeys ↔ usePlainTextURLs relationship
  // customPageKeys is legacy, inverted logic of usePlainTextURLs
  if (
    data.customPageKeys !== undefined &&
    data.usePlainTextURLs === undefined
  ) {
    migrated.usePlainTextURLs = !data.customPageKeys;
  }

  // Handle legacy sortOrder values
  // Map old values: 'created' → 'createdAt', 'updated' → 'flowTime'
  if (typeof data.sortOrder === 'string') {
    const sortOrderMap: Record<string, SiteSortOrder> = {
      created: 'createdAt',
      updated: 'flowTime',
    };
    const legacyValue = data.sortOrder as string;
    if (legacyValue in sortOrderMap) {
      migrated.sortOrder = sortOrderMap[legacyValue];
    }
  }

  return migrated;
}
