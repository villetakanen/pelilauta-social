````markdown
# PBI-021: NounSelect.svelte Component for Dynamic Icon Selection

**User Story:** As a developer building admin interfaces and forms, I want a reusable NounSelect component that dynamically displays all available icons from the `/public/icons/` directory, so that users can visually select appropriate icons without hardcoded options, enabling better UX and maintainability for icon-based selections.

## Problem Statement

The current icon selection system has significant limitations that hinder usability and maintainability:

1. **Hardcoded Icon Options**: Current implementation in `AddChannelDialog.svelte` uses placeholder values ("icon1", "icon2", "icon3") instead of real icons
2. **No Visual Preview**: Users cannot see what icons look like when selecting them
3. **Limited Icon Access**: Only 2 icons defined in `CHANNEL_NOUNS` array, while `/public/icons/` contains 60+ available icons
4. **No Dynamic Discovery**: Adding new icons requires manual code updates across multiple components
5. **Poor UX**: Text-only selection doesn't show visual representation of icons
6. **Maintenance Overhead**: Each form needing icon selection must implement its own selection logic
7. **Inconsistent Implementation**: No standardized way to select icons across the application

## Current Situation Analysis

### Available Icons (60+ icons in `/public/icons/`)
From the directory listing, we have icons like: `add`, `admin`, `adventurer`, `arrow-down`, `avatar`, `books`, `card`, `check`, `discussion`, `edit`, `gamepad`, `homebrew`, `tools`, etc.

### Current Usage Patterns
- Icons used via `<cn-icon noun="iconname">` where `iconname` matches filename without `.svg`
- Default fallback is typically `discussion` icon
- Channel schema uses string `icon` field with default value `'discussion'`
- Current `AddChannelDialog` has non-functional placeholder options

### Current Limitations
```svelte
<!-- Current broken implementation -->
<select bind:value={icon}>
  <option value="icon1">Icon 1</option>  <!-- Not real icons -->
  <option value="icon2">Icon 2</option>
  <option value="icon3">Icon 3</option>
</select>
```

## Proposed Solution

Create a comprehensive `NounSelect.svelte` component that dynamically discovers available icons and provides an intuitive selection interface with visual previews.

### Core Features

1. **Build-Time Icon Discovery**: Automatically populate options from `/public/icons/` directory at build time
2. **Visual Icon Preview**: Show actual icon rendering in dropdown options and selected state
3. **Search/Filter Capability**: Allow users to filter icons by name
4. **Accessible Design**: Proper ARIA labels, keyboard navigation, screen reader support
5. **Customizable Styling**: Support different sizes (small, medium, large) and layouts
6. **Default Value Handling**: Support default selection with fallback options
7. **Static Asset Optimization**: Pre-generated icon list with zero runtime overhead
8. **Reusable Component**: Drop-in replacement for any icon selection needs

### Key Components

- **NounSelect.svelte**: Main component with dropdown interface and search
- **IconOption.svelte**: Individual icon option rendering component  
- **Build-Time Icon Generator**: Script/utility to generate static icon list during build
- **Static Icon Data**: Pre-generated JSON with available icons
- **Icon Preview**: Live preview of selected icon
- **Search Integration**: Filter icons by name or category

## Acceptance Criteria

### Build-Time Icon Generation
- [ ] **Build Script**: Create utility to scan `/public/icons/` and generate static icon list
- [ ] **Static Data Generation**: Generate `src/data/available-icons.json` at build time
- [ ] **File Filtering**: Filter out non-SVG files and design files (`.afdesign`, `.ai`)
- [ ] **Integration with Build Process**: Hook into Astro build pipeline or package.json scripts
- [ ] **Development Mode**: Support both build-time generation and hot reload during development
- [ ] **Error Handling**: Graceful handling if icons directory missing or inaccessible

### NounSelect Component Interface
- [ ] **Props**: `value: string`, `defaultValue: string = 'discussion'`, `placeholder: string`, `disabled: boolean = false`
- [ ] **Props**: `size: 'small' | 'medium' | 'large' = 'medium'`, `searchable: boolean = true`
- [ ] **Events**: `onchange: (selectedIcon: string) => void`
- [ ] Two-way binding support with `bind:value={selectedIcon}`
- [ ] Required/optional validation support
- [ ] Custom CSS class support via `class` prop

### Visual Design & UX
- [ ] **Dropdown Interface**: Clean dropdown showing icons with names
- [ ] **Icon Preview**: Each option shows actual `<cn-icon>` rendering alongside name
- [ ] **Selected State**: Current selection shows both icon and name clearly
- [ ] **Search Functionality**: Real-time filtering of icons by typing name
- [ ] **Loading States**: Skeleton/spinner while loading icon list from API
- [ ] **Empty States**: Appropriate message if no icons found or API fails
- [ ] **Responsive Design**: Works on desktop, tablet, and mobile devices

### Accessibility Features  
- [ ] **Keyboard Navigation**: Arrow keys, Enter/Space selection, Escape to close
- [ ] **Screen Reader Support**: Proper ARIA labels and descriptions
- [ ] **Focus Management**: Clear focus indicators and logical tab order
- [ ] **High Contrast**: Icons visible in high contrast mode
- [ ] **Reduced Motion**: Respects `prefers-reduced-motion` for animations

### Integration & Backwards Compatibility
- [ ] **Channel Admin Integration**: Replace hardcoded options in `AddChannelDialog.svelte`
- [ ] **Channel Schema Support**: Works with existing `ChannelSchema.icon` field
- [ ] **Default Handling**: Graceful fallback to 'discussion' icon if selection invalid
- [ ] **Error Recovery**: Handles cases where selected icon no longer exists
- [ ] **Performance**: Minimal impact on bundle size and runtime performance

### Search & Filtering
- [ ] **Real-time Search**: Filter icons as user types in search input
- [ ] **Fuzzy Matching**: Find icons with partial/approximate name matches  
- [ ] **Category Hints**: Group or hint at icon categories (UI, game, navigation, etc.)
- [ ] **Clear Search**: Easy way to clear search and show all icons
- [ ] **Search Persistence**: Maintain search state while dropdown is open

## Technical Implementation

### Build-Time Icon Generation

**Option 1: Astro Content Collections (Recommended)**
```typescript
// src/content/config.ts - Add to existing collections
import { glob } from 'astro/loaders';
import path from 'node:path';

const icons = defineCollection({
  loader: glob({ 
    pattern: '*.svg', 
    base: './public/icons',
    // Transform to get just the noun name
    generateId: ({ entry }) => path.basename(entry, '.svg'),
  }),
  schema: z.object({
    noun: z.string(),
    // Could extend with categories, tags, etc. in future
  }),
});

export const collections = { docs, icons };
```

**Option 2: Build-Time Script with Import**
```typescript
// scripts/generate-icons.ts
import fs from 'node:fs';
import path from 'node:path';

async function generateIconsList() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  const files = await fs.promises.readdir(iconsDir);
  
  const icons = files
    .filter(file => 
      file.endsWith('.svg') && 
      !file.includes('.afdesign') && 
      !file.includes('.ai')
    )
    .map(file => file.replace('.svg', ''))
    .sort();
  
  const output = path.join(process.cwd(), 'src', 'data', 'available-icons.json');
  await fs.promises.writeFile(output, JSON.stringify({ icons }, null, 2));
  
  console.log(`Generated ${icons.length} icons to ${output}`);
}

generateIconsList().catch(console.error);
```

**Option 3: Vite Virtual Module (Most Optimized)**
```typescript
// vite.config.ts plugin
import fs from 'node:fs';
import path from 'node:path';

function iconsPlugin() {
  const virtualModuleId = 'virtual:icons';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'icons-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const iconsDir = path.join(process.cwd(), 'public', 'icons');
        const files = fs.readdirSync(iconsDir);
        
        const icons = files
          .filter(file => file.endsWith('.svg') && !file.includes('.afdesign'))
          .map(file => file.replace('.svg', ''))
          .sort();
        
        return `export const AVAILABLE_ICONS = ${JSON.stringify(icons)};`;
      }
    }
  };
}

// Add to astro.config.mjs
export default defineConfig({
  vite: {
    plugins: [
      iconsPlugin(),
      // ... other plugins
    ]
  }
});
```

### NounSelect Component Structure
```svelte
<!-- src/components/ui/NounSelect.svelte -->
<script lang="ts">
import '@11thdeg/cyan-lit/dist/components/cn-icon.js';
// Option 1: Content Collections
import { getCollection } from 'astro:content';
// Option 2: Static Import  
// import { icons as AVAILABLE_ICONS } from '@data/available-icons.json';
// Option 3: Virtual Module
// import { AVAILABLE_ICONS } from 'virtual:icons';

interface Props {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  searchable?: boolean;
  required?: boolean;
  onchange?: (value: string) => void;
}

const { 
  value = $bindable(''),
  defaultValue = 'discussion',
  placeholder = 'Select an icon...',
  disabled = false,
  size = 'medium',
  searchable = true,
  required = false,
  onchange = () => {}
}: Props = $props();

// Static icon list - no API calls needed!
const availableIcons: string[] = AVAILABLE_ICONS; // Already available at build time
let isOpen = $state(false);
let searchTerm = $state('');

// Filtered icons based on search
const filteredIcons = $derived.by(() => {
  if (!searchTerm) return availableIcons;
  return availableIcons.filter(icon => 
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );
});

// Initialize with default if needed
$effect(() => {
  if (!value && defaultValue) {
    value = defaultValue;
    onchange(value);
  }
});

function selectIcon(iconName: string) {
  value = iconName;
  onchange(iconName);
  isOpen = false;
  searchTerm = '';
}

function toggleDropdown() {
  if (disabled) return;
  isOpen = !isOpen;
  if (!isOpen) searchTerm = '';
}

function handleKeydown(event: KeyboardEvent) {
  if (disabled) return;
  
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      toggleDropdown();
      break;
    case 'Escape':
      isOpen = false;
      searchTerm = '';
      break;
  }
}
</script>

<div class="noun-select" class:disabled class:open={isOpen}>
  <!-- Selected value display -->
  <button 
    type="button"
    class="noun-select-trigger {size}"
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={placeholder}
  >
    {#if value}
      <cn-icon noun={value} small={size === 'small'} large={size === 'large'}></cn-icon>
      <span>{value}</span>
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <cn-icon noun="open-down" small></cn-icon>
  </button>
  
  <!-- Dropdown content -->
  {#if isOpen}
    <div class="noun-select-dropdown" role="listbox">
      {#if searchable}
        <div class="search-container">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search icons..."
            class="search-input"
          />
          <cn-icon noun="search" small></cn-icon>
        </div>
      {/if}
      
      <div class="icons-list">
        {#if filteredIcons.length === 0}
          <div class="empty-state">
            <span>No icons found for "{searchTerm}"</span>
          </div>
        {:else}
          {#each filteredIcons as icon}
            <button
              type="button"
              class="icon-option"
              class:selected={value === icon}
              onclick={() => selectIcon(icon)}
              role="option"
              aria-selected={value === icon}
            >
              <cn-icon noun={icon} small></cn-icon>
              <span>{icon}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Same CSS styles as before... -->
```

### Integration with AddChannelDialog
```svelte
<!-- Updated AddChannelDialog.svelte -->
<script lang="ts">
import NounSelect from '../../../ui/NounSelect.svelte';

let icon = $state('discussion'); // Default to real icon

// ... rest of component logic
</script>

<dialog bind:this={dialogRef}>    
  <form onsubmit={handleSubmit} class="dialog-form">                   
    <fieldset>
      <!-- ... other fields ... -->
      
      <label>
        Icon:
        <NounSelect 
          bind:value={icon}
          defaultValue="discussion"
          placeholder="Choose an icon..."
          searchable
          required
        />
      </label>
    </fieldset>
    
    <!-- ... rest of form ... -->
  </form>
</dialog>
```

## Dependencies

- **Build-Time Processing**: Node.js `fs` module for reading `/public/icons/` during build
- **Cyan Design System**: `cn-icon` components for rendering  
- **Existing Icon System**: Compatible with current `<cn-icon noun="...">` pattern
- **Astro Build Pipeline**: Integration with Astro's build system for static generation
- **Static Asset Optimization**: No runtime API calls or dynamic loading needed

### Build Approach Comparison

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Content Collections** | Native Astro integration, typed collections, extensible | More setup, overkill for simple list | Future icon metadata features |
| **Build Script + JSON** | Simple, explicit, easy to understand | Manual build step, separate process | Quick implementation |
| **Vite Virtual Module** | Zero runtime cost, tree-shakeable, seamless | More complex setup, Vite-specific | Maximum optimization |

**Recommended: Build Script + JSON Import** - Best balance of simplicity and performance for this use case.

## Out of Scope (Future Enhancements)

- **Icon Categories**: Grouping icons by purpose (UI, game, navigation)
- **Icon Upload**: Admin interface for uploading custom icons
- **Icon Search Tags**: Metadata-based searching beyond filename
- **Icon Previews**: Larger preview modals or hover previews
- **Custom Icon Sets**: Support for multiple icon libraries
- **Icon Analytics**: Tracking which icons are most commonly used
- **Batch Icon Operations**: Bulk icon management for admins
- **Icon Versioning**: Managing icon updates and backwards compatibility

## Implementation Steps

### Phase 1: Build-Time Foundation
1. **Create Icon Generation Script**: Implement build-time script to scan `/public/icons/` directory
2. **Generate Static Data**: Create `src/data/available-icons.json` with icon list
3. **Build Integration**: Add script to `package.json` build process or pre-build hook
4. **Development Workflow**: Ensure script runs during development for icon additions

### Phase 2: Core Component  
5. **NounSelect Structure**: Create basic component with props and static icon import
6. **Icon Loading**: Import static icon data instead of API calls
7. **Basic Dropdown**: Create dropdown interface with icon list
8. **Two-way Binding**: Ensure proper Svelte binding and change events

### Phase 3: Enhanced UX
9. **Search Functionality**: Add real-time icon filtering by name
10. **Visual Design**: Style component with Cyan Design System patterns
11. **Icon Previews**: Show actual `cn-icon` renderings in dropdown
12. **Simplified States**: Remove loading states (icons are immediately available)

### Phase 4: Accessibility & Polish
13. **Keyboard Navigation**: Implement full keyboard support (arrows, enter, escape)
14. **ARIA Labels**: Add proper accessibility attributes and screen reader support
15. **Focus Management**: Ensure logical focus order and clear focus indicators
16. **Responsive Design**: Ensure component works on all device sizes

### Phase 5: Integration & Testing
17. **AddChannelDialog Update**: Replace hardcoded options with NounSelect
18. **Channel Schema Integration**: Ensure compatibility with existing icon field
19. **Build Process Testing**: Verify icon generation works in CI/CD pipeline
20. **Performance Validation**: Confirm zero runtime overhead for icon discovery

## Non-Functional Requirements

### Performance
- **Zero Runtime Overhead**: Icon list generated at build time, no API calls needed
- **Instant Availability**: Icons available immediately when component mounts
- **Efficient Search**: Client-side filtering with no server round-trips  
- **Minimal Bundle Impact**: Static JSON import adds negligible size to bundle
- **No Loading States**: Eliminates loading spinners and error handling for icon discovery

### Accessibility
- Full keyboard navigation support for dropdown interaction
- Screen reader compatible with proper ARIA labeling
- High contrast mode support for icon visibility
- Respects user's reduced motion preferences

### Maintainability  
- Component should automatically discover new icons when added to `/public/icons/`
- No manual updates needed when icon library grows
- Clear separation of concerns between API, component, and usage
- Comprehensive error handling prevents component breakage

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers
- Consistent behavior across different operating systems
- Mobile-friendly touch interactions

## Priority

**Medium-High** - Improves UX for admin interfaces and enables proper icon selection, fixing current broken implementation in channel admin

## Estimated Effort

**1-2 sprints** - Involves API development, comprehensive component creation, accessibility implementation, and integration across multiple admin interfaces

## Definition of Done

### Build-Time Generation & Integration
- [ ] Build script generates accurate list of available icons from `/public/icons/`
- [ ] Script properly filters out non-SVG and design files  
- [ ] Generated data integrated into Astro build pipeline or package.json scripts
- [ ] Development workflow supports adding new icons without manual regeneration
- [ ] Build process tested in CI/CD environment

### Component Functionality  
- [ ] NounSelect component renders available icons with visual previews using static data
- [ ] Two-way binding works correctly with parent components
- [ ] Search functionality filters icons in real-time with client-side processing
- [ ] Empty states handled gracefully (no loading states needed)
- [ ] Component accepts all specified props and emits change events

### Accessibility & UX
- [ ] Full keyboard navigation implemented (arrows, enter, escape, tab)
- [ ] Screen readers can navigate and select icons appropriately  
- [ ] Focus management provides clear visual indicators
- [ ] Component works responsively on desktop, tablet, and mobile
- [ ] Visual design follows Cyan Design System patterns

### Integration & Testing
- [ ] AddChannelDialog updated to use NounSelect instead of hardcoded options
- [ ] Component works with existing ChannelSchema icon field
- [ ] End-to-end tests verify complete icon selection workflow
- [ ] Performance impact minimal on page load and runtime
- [ ] Component demonstrates in Storybook or dev environment

### Documentation & Standards
- [ ] Component interface documented with JSDoc comments
- [ ] Usage examples provided for different configuration options
- [ ] API endpoint documented in project API documentation
- [ ] Code follows project TypeScript and Svelte patterns
- [ ] Accessibility testing completed and documented
````