import { z } from 'zod';

/**
 * Tag synonym mapping configuration
 *
 * Structure:
 * - canonicalTag: The primary tag to use (lowercase, URL-encoded)
 * - displayName: How to display the tag in UI
 * - synonyms: Array of alternative spellings/names (lowercase)
 * - description: Optional description for SEO
 */
export const TagSynonymSchema = z.object({
  canonicalTag: z.string(),
  displayName: z.string(),
  synonyms: z.array(z.string()),
  description: z.string().optional(),
  icon: z.string().optional(), // cn-icon noun or name
});

export type TagSynonym = z.infer<typeof TagSynonymSchema>;

/**
 * Predefined tag synonyms for popular RPG systems
 */
export const TAG_SYNONYMS: TagSynonym[] = [
  {
    canonicalTag: 'd%26d',
    displayName: 'D&D',
    synonyms: [
      'dnd',
      'd&d',
      'dungeons & dragons',
      'dungeons and dragons',
      'dd',
      'd and d',
      'deddu',
    ],
    description: 'Dungeons & Dragons keskustelut, kampanjat ja materiaalit',
    icon: 'd20',
  },
  {
    canonicalTag: 'pathfinder',
    displayName: 'Pathfinder',
    synonyms: ['pathfinder 2e', 'pf2e', 'pathfinder 1e', 'pf1e', 'pf', 'päffä'],
    description: 'Pathfinder-roolipeli, säännöt, hahmot ja seikkailut',
    icon: 'compass',
  },
  {
    canonicalTag: 'legendoja %26 lohikäärmeitä',
    displayName: 'Legendoja & lohikäärmeitä',
    synonyms: [
      'legendoja ja lohikäärmeita',
      'l&l',
      'll',
      'löllö',
      'letl',
      'lössö',
      'Suuri seikkailu',
    ],
    description:
      'Legendoja ja Lohikäärmeitä -roolipeliin liittyvät keskustelut ja sivut.',
    icon: 'll-ampersand',
  },
  {
    canonicalTag: 'pbta',
    displayName: 'PbtA',
    synonyms: [
      'powered by the apocalypse',
      'apocalypse world',
      'pbta-pelit',
      'FitD',
    ],
    description: 'Powered by the Apocalypse -järjestelmän pelit ja keskustelut',
    icon: 'books',
  },
  {
    canonicalTag: 'call+of+cthulhu',
    displayName: 'Call of Cthulhu',
    synonyms: ['coc', 'cthulhu', 'call of cthulu', 'delta green', 'dg'],
    description: 'Call of Cthulhu ja muut sen sukulaiset',
    icon: 'tentacles',
  },
];

/**
 * Build a lookup map for fast synonym resolution
 * Key: synonym (lowercase) -> Value: canonical tag
 */
export function buildSynonymMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const entry of TAG_SYNONYMS) {
    // Add canonical tag to itself
    map.set(entry.canonicalTag.toLowerCase(), entry.canonicalTag);

    // Add all synonyms pointing to canonical
    for (const synonym of entry.synonyms) {
      map.set(synonym.toLowerCase(), entry.canonicalTag);
    }
  }

  return map;
}

/**
 * Resolve a tag to its canonical form
 * Returns the canonical tag if synonym found, otherwise returns input
 */
export function resolveTagSynonym(tag: string): string {
  const synonymMap = buildSynonymMap();
  const normalized = tag.toLowerCase();
  return synonymMap.get(normalized) || normalized;
}

/**
 * Get display information for a tag
 */
export function getTagDisplayInfo(tag: string): TagSynonym | null {
  const canonical = resolveTagSynonym(tag);
  // Decode both the canonical and stored tags for comparison
  const decodedCanonical = decodeURIComponent(canonical.toLowerCase());
  return (
    TAG_SYNONYMS.find(
      (t) =>
        decodeURIComponent(t.canonicalTag.toLowerCase()) === decodedCanonical,
    ) || null
  );
}
