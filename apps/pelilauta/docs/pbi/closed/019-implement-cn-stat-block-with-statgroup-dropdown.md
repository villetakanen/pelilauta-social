# PBI-019: Implement cn-stat-block Component with StatGroup Type Dropdown

**User Story:** As a site owner creating character sheet templates, I want to organize character stats using the standardized `cn-stat-block` component with configurable layout options, so that character sheets display stats in a clean, organized, and visually consistent manner with proper grouping and layout control.

## Problem Statement

The current character sheet editor lacks proper visual organization for character stats and doesn't utilize the Cyan Design System's `cn-stat-block` component. This results in:

1. **Inconsistent Visual Layout**: Stats are not organized using the standardized card-based stat block component
2. **Missing Layout Options**: No ability to choose between different stat block layouts (rows, grid-2, grid-3)
3. **Poor Visual Hierarchy**: Stats lack proper visual grouping and card-based presentation
4. **No Layout Persistence**: StatGroup layout preferences are not stored or configurable per group
5. **Suboptimal UX**: Character sheets don't follow Cyan Design System patterns for stat organization

## Current Situation

- Character stats in the sheet editor are displayed without proper visual grouping
- No use of `cn-stat-block` component from Cyan Design System
- StatGroups in `CharacterSheetSchema` are simple strings without layout information
- No UI for selecting stat block layout types for different stat groups
- Character sheet display lacks the visual polish of standardized stat blocks

## Proposed Solution

Enhance the character sheet system to use `cn-stat-block` components with configurable layouts by updating the schema and implementing layout selection UI.

### Core Features

1. **Enhanced StatGroups Schema**: Update `CharacterSheetSchema.statGroups` from `string[]` to objects with `{key: string, layout: 'rows' | 'grid-2' | 'grid-3'}`
2. **Layout Selection UI**: Add dropdown in sheet editor for each stat group to select layout type  
3. **cn-stat-block Integration**: Replace current stat display with `cn-stat-block` components
4. **Layout Persistence**: Save and restore layout preferences per stat group
5. **Migration Support**: Handle existing character sheets with string-based stat groups

### Key Components

- **Enhanced CharacterSheetSchema**: Updated schema with layout-aware stat groups
- **StatGroup Layout Selector**: Dropdown component for selecting stat block layouts
- **cn-stat-block Implementation**: Integration of Cyan Design System stat block component
- **Schema Migration**: Automatic conversion of existing string-based stat groups

## Acceptance Criteria

### Schema Updates
- [ ] `CharacterSheetSchema.statGroups` updated from `z.array(z.string())` to support layout objects
- [ ] StatGroup objects include `key: string` and `layout: 'rows' | 'grid-2' | 'grid-3'` properties
- [ ] Schema migration handles existing character sheets with string-based stat groups
- [ ] Backward compatibility maintained during transition period
- [ ] Default layout for migrated stat groups set to 'rows'

### Layout Selection UI
- [ ] Dropdown added to each stat group in sheet editor for layout selection
- [ ] Layout options displayed as: "Rows (single column)", "Grid 2-column", "Grid 3-column"
- [ ] Layout selection persisted immediately when changed
- [ ] Visual feedback shows current layout type for each stat group
- [ ] Layout dropdown positioned logically within stat group header/toolbar area

### cn-stat-block Component Integration
- [ ] Character sheet display uses `cn-stat-block` component for all stat groups
- [ ] Each stat group rendered with its configured layout ('rows', 'grid-2', or 'grid-3')
- [ ] Stat block labels use the stat group key/name
- [ ] Individual stats properly slotted within stat block component
- [ ] Component imported correctly: `import '@11thdeg/cyan-lit/dist/components/cn-stat-block.js'`

### Character Sheet Editor Integration
- [ ] SheetEditor.svelte updated to display layout selection for each stat group
- [ ] StatsSection.svelte updated to use `cn-stat-block` with appropriate layout
- [ ] Layout changes reflected immediately in editor preview
- [ ] Stat group creation includes default layout selection
- [ ] Layout selection only available to authorized users (admins)

### Data Validation & Error Handling
- [ ] Enhanced CharacterSheetSchema validates layout values correctly
- [ ] Invalid layout values handled gracefully with fallback to 'rows'
- [ ] Schema parsing errors provide clear feedback to users
- [ ] Migration errors logged but don't break existing functionality

## Technical Implementation

### Schema Updates
```typescript
// Updated CharacterSheetSchema
const StatGroupSchema = z.object({
  key: z.string().min(1, 'StatGroup key cannot be empty'),
  layout: z.enum(['rows', 'grid-2', 'grid-3']).default('rows'),
});

export const CharacterSheetSchema = z.object({
  // ... existing fields
  statGroups: z.array(StatGroupSchema).default([]),
  // ... rest of schema
});

export type StatGroup = z.infer<typeof StatGroupSchema>;
```

### Migration Strategy
```typescript
// Schema migration function for existing character sheets
function migrateStatGroups(sheet: any): CharacterSheet {
  if (Array.isArray(sheet.statGroups) && sheet.statGroups.length > 0) {
    // Check if first element is string (old format)
    if (typeof sheet.statGroups[0] === 'string') {
      sheet.statGroups = sheet.statGroups.map((groupName: string) => ({
        key: groupName,
        layout: 'rows' as const
      }));
    }
  }
  return CharacterSheetSchema.parse(sheet);
}
```

### Component Updates
```svelte
<!-- SheetEditor.svelte - Layout Selection -->
{#each $sheet?.statGroups || [] as group}
  <div class="p-1 surface">
    <div class="toolbar pt-0 mt-0">
      <h4 class="text-h5">{group.key}</h4>
      <select 
        bind:value={group.layout}
        on:change={() => updateGroupLayout(group.key, group.layout)}
      >
        <option value="rows">Rows (single column)</option>
        <option value="grid-2">Grid 2-column</option>
        <option value="grid-3">Grid 3-column</option>
      </select>
      <button type="button" class="text" onclick={() => removeGroup(group.key)}>
        <cn-icon noun="delete"></cn-icon>
      </button>
    </div>
    <StatsSection group={group.key} layout={group.layout} />
  </div>
{/each}
```

```svelte
<!-- StatsSection.svelte - cn-stat-block Integration -->
<script lang="ts">
import '@11thdeg/cyan-lit/dist/components/cn-stat-block.js';

interface Props {
  group: string;
  layout: 'rows' | 'grid-2' | 'grid-3';
}
const { group, layout }: Props = $props();
</script>

<cn-stat-block label={group} {layout}>
  {#each stats.filter(s => s.group === group) as stat}
    <StatEditor {stat} />
  {/each}
</cn-stat-block>
```

### API Updates
- Character sheet save/load operations handle new StatGroup schema
- Validation ensures layout values are valid enum options
- Migration applied automatically when loading existing sheets

## Dependencies

- **Cyan Design System**: Requires `cn-stat-block` component from `@11tydeg/cyan-lit`
- **Existing Character Sheet System**: Builds on current `CharacterSheetSchema` and editor components
- **Schema Migration Utilities**: May need utilities for smooth data migration
- **Zod Validation**: Enhanced schema validation for new StatGroup structure

## Out of Scope (Future Enhancements)

- **Custom Layout Options**: Additional layout types beyond rows/grid-2/grid-3
- **Layout Preview**: Real-time preview of layout changes before saving
- **Drag-and-Drop Reordering**: Changing stat order within stat blocks
- **Conditional Layouts**: Different layouts based on screen size or device type
- **Layout Templates**: Pre-defined layout combinations for common character sheet types

## Implementation Steps

### Phase 1: Schema Foundation
1. **Update CharacterSheetSchema**: Change statGroups from string array to StatGroup objects
2. **Create Migration Function**: Handle conversion of existing string-based stat groups
3. **Update Type Definitions**: Ensure TypeScript types reflect new schema structure
4. **Schema Validation**: Test new schema with existing and new character sheets

### Phase 2: Component Integration
5. **Import cn-stat-block**: Add component import to relevant files
6. **Update StatsSection**: Replace current stat display with cn-stat-block component
7. **Layout Prop Integration**: Pass layout from stat group configuration to component
8. **Visual Validation**: Ensure stat blocks display correctly with different layouts

### Phase 3: Editor UI Enhancement
9. **Add Layout Dropdown**: Create dropdown for layout selection in stat group toolbar
10. **Update SheetEditor**: Integrate layout selection UI with existing stat group management
11. **Event Handling**: Implement layout change persistence in character sheet store
12. **User Feedback**: Add visual indicators for current layout selection

### Phase 4: Testing & Migration
13. **Migration Testing**: Test conversion of existing character sheets
14. **Layout Testing**: Verify all layout options work correctly with various stat types
15. **Edge Case Handling**: Test with empty stat groups, invalid data, etc.
16. **E2E Testing**: Full workflow testing of layout selection and persistence

## Non-Functional Requirements

### Performance
- Schema migration should be fast and non-blocking
- Layout changes should update immediately without full page reload
- cn-stat-block component should render efficiently with multiple stat groups

### Compatibility
- Existing character sheets must continue working during migration
- Gradual migration approach prevents breaking changes
- Fallback to 'rows' layout for any invalid configurations

### Accessibility
- Layout dropdown properly labeled for screen readers
- cn-stat-block component maintains accessibility features
- Keyboard navigation works for layout selection

### Testing
- Unit tests for schema migration function
- Component tests for layout dropdown and cn-stat-block integration  
- E2E tests covering full layout selection workflow
- Migration testing with various existing character sheet formats

## Priority

**Medium** - Improves visual consistency and user experience for character sheets, aligns with design system standards

## Estimated Effort

**1-2 sprints** - Involves schema changes, component integration, and migration support, but builds on existing patterns

## Definition of Done

- [ ] CharacterSheetSchema updated to support StatGroup objects with layout property
- [ ] Migration function converts existing string-based stat groups to new format
- [ ] Layout dropdown added to stat group editor with all three options
- [ ] cn-stat-block component integrated and displays stats with selected layout
- [ ] Layout changes persist immediately when selected in editor
- [ ] All existing character sheets continue working after schema migration
- [ ] Unit tests cover schema migration and component integration
- [ ] E2E tests verify full layout selection and persistence workflow
- [ ] Visual regression testing ensures consistent appearance across layouts
- [ ] Code follows project patterns and Cyan Design System integration standards
- [ ] Documentation updated to reflect new StatGroup schema and layout options