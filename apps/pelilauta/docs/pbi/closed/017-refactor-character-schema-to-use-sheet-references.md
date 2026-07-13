# PBI 017: Refactor Character Schema to Use Sheet References

**User Story:** As a developer, I want characters to reference character sheets instead of embedding them, and store stats as a simple key-value map, so that users can change character sheets dynamically and stat handling is simplified across the application.

## Current Situation

Based on manual testing and user feedback, the current character schema has fundamental design flaws:

**Current Schema Issues:**
- Characters embed entire `CharacterSheetSchema` objects, making sheet changes impossible
- Character stats inherit complex typed structure from sheets, creating unnecessary complexity
- No ability to switch a character between different sheet templates
- Sheet-specific stat types leak into character data, creating tight coupling

**Current Character Schema:**
```typescript
export const CharacterSchema = ContentEntrySchema.extend({
  name: z.string().min(1, 'Character name cannot be empty.'),
  description: z.string().optional(),
  siteKey: z.string().optional(),
  sheet: CharacterSheetSchema.optional(), // ❌ Embedded sheet
  avatar: z.string().url().optional(),
});
```

## Acceptance Criteria

### Schema Changes
1. **Sheet Reference**: Characters should reference sheets by key instead of embedding them
   - Replace `sheet: CharacterSheetSchema.optional()` with `sheetKey: z.string().optional()`
   - Characters can change their referenced sheet at any time

2. **Simplified Stats Storage**: Character stats should be stored as a simple key-value map
   - Replace complex typed stats with `stats: z.record(z.union([z.string(), z.number(), z.boolean()])).default({})`
   - Each stat value can be a string, number, or boolean - no type enforcement at schema level

3. **Backward Compatibility**: Schema changes should not break existing character data
   - Migration strategy defined (though not implemented since no production data exists)
   - Test data can be reset/recreated

### Implementation Requirements
4. **Update All Character Usage**: All code that uses characters must be updated
   - Character store (`characterStore.ts`)
   - Character components (Svelte apps)
   - Server-side character utilities
   - API endpoints that handle characters

5. **Update E2E Tests**: All character-related tests must be updated
   - Character creation tests (`create-character.spec.ts`)
   - Character editing tests (`character-sheet-editing.spec.ts`)
   - Any other tests that create or manipulate character data

6. **Sheet Resolution Logic**: Add utilities to resolve sheet data from character references
   - Function to get sheet by key and merge with character stats
   - Handle missing sheet references gracefully
   - Default sheet behavior when no sheet is referenced

## Proposed New Schema

```typescript
export const CharacterSchema = ContentEntrySchema.extend({
  /** The name of the character. */
  name: z.string().min(1, 'Character name cannot be empty.'),

  /** A public-facing summary or description of the character. */
  description: z.string().optional(),

  /** The key of the site this character belongs to. */
  siteKey: z.string().optional(),

  /** Reference to a character sheet template by key. */
  sheetKey: z.string().optional(),

  /** Character stats as key-value pairs. Values can be string, number, or boolean. */
  stats: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),

  /** URL for the character's avatar image. */
  avatar: z.string().url().optional(),
}).describe('A player character entry.');
```

## Implementation Impact Analysis

### Files to Update

**Schema Files:**
- ✅ `src/schemas/CharacterSchema.ts` - Primary schema change

**Store Files:**
- ⚠️ `src/stores/characters/characterStore.ts` - Update character handling

**Component Files:**
- ⚠️ `src/components/svelte/characters/CharacterApp/` - Update character display
- ⚠️ `src/components/svelte/characters/CharacterEditorApp/` - Update character editing
- ⚠️ All stat-related components - Update to handle simple key-value stats

**Server Utilities:**
- ⚠️ `src/firebase/server/characters/getCharacter.ts` - Update server-side character fetching
- ⚠️ Any character creation/update utilities

**Page Files:**
- ⚠️ `src/pages/characters/[characterKey]/index.astro`
- ⚠️ `src/pages/characters/[characterKey]/edit.astro`
- ⚠️ Character creation wizard pages

**E2E Tests:**
- ❌ `e2e/create-character.spec.ts` - Update character creation test
- ❌ `e2e/character-sheet-editing.spec.ts` - Update character editing test
- ❌ Any other tests that interact with characters

### New Utilities Needed

1. **Sheet Resolution Utility**: 
   ```typescript
   async function resolveCharacterWithSheet(character: Character): Promise<CharacterWithResolvedSheet>
   ```

2. **Stat Mapping Utility**:
   ```typescript
   function mapCharacterStatsToSheet(character: Character, sheet: CharacterSheet): MappedStats
   ```

3. **Migration Helpers** (for future use):
   ```typescript
   function migrateCharacterFromEmbeddedSheet(oldCharacter: any): Character
   ```

## Migration Strategy

Since there is no production data:

1. **Test Data Reset**: All test character data can be recreated with new schema
2. **E2E Test Update**: Update all character-related E2E tests to use new schema
3. **Development Reset**: Clear development Firebase collections and recreate test data

## Out of Scope

- **Advanced Stat Types**: Keep focus on simple string/number/boolean values
- **Sheet Validation**: Don't enforce sheet-specific stat requirements at character level
- **Migration Scripts**: No automated migration needed (no production data)
- **UI Changes**: Character sheet display logic can remain largely the same

## Technical Considerations

### Benefits of New Approach
- **Flexibility**: Characters can switch between different sheet templates
- **Simplicity**: No complex stat type validation at character level
- **Loose Coupling**: Characters don't depend on specific sheet structure
- **Future-Proof**: Easy to add new sheet types without breaking characters

### Potential Challenges
- **Sheet Resolution**: Need to handle missing or invalid sheet references
- **Type Safety**: Less compile-time checking of stat values
- **Performance**: Additional sheet lookups when displaying characters

## Implementation Phases

### Phase 1: Schema and Core Updates
1. Update `CharacterSchema.ts` with new structure
2. Update character store to handle new schema
3. Add sheet resolution utilities

### Phase 2: Component Updates  
4. Update character display components to resolve sheets
5. Update character editing components to work with simple stats
6. Update character creation wizard

### Phase 3: Testing Updates
7. Update all E2E tests
8. Reset test data to use new schema
9. Verify all character workflows work end-to-end

### Phase 4: Server-side Updates
10. Update server-side character utilities
11. Update API endpoints
12. Update Astro pages that handle characters

## Definition of Done

- [ ] Character schema updated with `sheetKey` and `stats` fields
- [ ] All character store logic updated to handle new schema
- [ ] Character display components resolve sheets dynamically  
- [ ] Character editing works with simple key-value stats
- [ ] All E2E tests updated and passing
- [ ] No remaining references to embedded character sheets
- [ ] Sheet resolution utilities implemented and tested
- [ ] Manual testing confirms characters can change sheet templates

## Ready for Implementation

✅ **Clear Problem**: Embedded sheets prevent flexibility and overcomplicate stats  
✅ **Simple Solution**: Reference sheets by key, store stats as simple key-value map  
✅ **Impact Identified**: All character-related code needs updates  
⏳ **Next Step**: Begin with schema update and character store changes