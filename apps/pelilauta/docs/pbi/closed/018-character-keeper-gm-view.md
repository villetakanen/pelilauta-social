# PBI-018: Character Keeper - GM Character Overview

**User Story:** As a site member (GM or player), I want the ability to view all characters in a consolidated overview using a selected character sheet template, so that I can see all character information in one place without needing to navigate between individual character pages during gameplay.

## Problem Statement

Site members (GMs and players) currently need to navigate between individual character pages to view character information, which disrupts game flow and makes it difficult to:

1. **Track Multiple Characters**: No unified view of all characters in a site/campaign
2. **Compare Character Information**: Must switch between tabs/pages to see different character states
3. **Real-time Updates**: No consolidated view that updates when characters are modified
4. **Quick Reference**: No single-page view for referencing multiple characters during gameplay

## Current Situation

- Characters exist as individual entities with their own character sheets
- GMs must navigate to each character's individual page to view their information
- No aggregated or overview functionality exists for multiple characters
- Character sheets are designed for individual character management, not GM oversight

## Proposed Solution

Create a "Character Keeper" feature that provides all site members with a consolidated, real-time view of all characters in the site.

### Core Features

1. **Character Keeper Activation**: Site owners can activate/deactivate the Character Keeper feature
2. **Configurable Character Sheet Template**: Site owners can select which character sheet template to use for the keeper view from available character sheets (for the site's system)
3. **Public Access**: All site members can access the Character Keeper once enabled
4. **Consolidated Character View**: Display all site characters in a single interface using the selected sheet template
5. **Real-time Updates**: Subscribe to character changes and update the view automatically
6. **Read-only Interface**: View-only functionality (no editing capabilities in this initial version)

### Key Components

- **Character Keeper Page**: New route for the consolidated character view
- **Sheet Template Selection**: Interface for GM to choose which character sheet template to use for the keeper view
- **Character Collection Store**: Real-time subscription to all characters in a site
- **Access Control**: Available to all authenticated site members (owners and players)

## Acceptance Criteria

### Authentication & Authorization
- [x] Character Keeper is only accessible to authenticated users
- [x] All authenticated site members (owners and players) can access the Character Keeper
- [x] Proper redirect to login page for unauthenticated users
- [x] Character Keeper page returns 404 or redirects when `useCharacters` is disabled
- [x] Character Keeper page returns 404 or redirects when `useCharacterKeeper` is disabled
- [x] Site membership verification ensures only site members can access

### Character Keeper Configuration
- [x] Character Keeper feature is only available when `useCharacters` is enabled
- [x] Site owners can activate/deactivate the Character Keeper feature (`useCharacterKeeper`) for their site
- [x] Site owners can select which character sheet template to use for the keeper view
- [x] Character sheet selection persisted per site (`characterKeeperSheetKey`)
- [x] Configuration settings are persisted in the site configuration
- [x] Clear UI indication when Character Keeper is enabled/disabled (visible to all site members)
- [x] UI prevents enabling Character Keeper when Characters feature is disabled
- [x] Disabling Characters feature automatically disables Character Keeper

### Character Overview
- [x] Consolidated view displays all characters associated with the site
- [x] Each character shows information using the site owner-selected character sheet template
- [x] All characters use the same selected template for consistency in the keeper view
- [x] Characters are displayed in a grid/list layout for easy scanning
- [x] Empty state shown when no characters exist for the site
- [x] Template selection available to site owners using API to fetch sheets by site system
- [x] Character sheet selector shows only sheets matching the site's system

### Real-time Updates & Caching (CSR)
- [x] Character Keeper uses stale-while-revalidate pattern for optimal performance
- [x] Cached character data loads instantly from local storage on page visit
- [x] Background Firestore subscriptions update cached data when characters change
- [x] Local storage persists character data between sessions
- [x] Real-time updates propagate to UI when background sync completes
- [x] New characters appear automatically when created (after background sync)
- [x] Deleted characters are removed from view automatically (after background sync)
- [x] Cache invalidation handles stale data scenarios

### Read-only Interface
- [x] All character information is display-only (no editing capabilities)
- [x] Clear visual indication that this is a read-only GM view
- [x] No edit buttons or input fields visible
- [x] Links to individual character pages for detailed editing (if needed)

### Performance & UX
- [x] Page loads instantly using cached data (stale-while-revalidate)
- [x] Background loading indicator shows when fresh data is being fetched
- [x] Responsive layout works on desktop and tablet devices
- [x] Standard site tray integration provides consistent navigation
- [x] Graceful degradation when offline (shows cached data)
- [x] Error handling for failed background updates
- [x] Cache freshness indicators (optional: show last updated time)

## Technical Implementation

### Database Schema
```typescript
// Extension to Site schema
interface Site {
  // ... existing fields
  useCharacterKeeper: z.boolean().optional(); // Character Keeper feature toggle
  characterKeeperSheetKey: z.string().optional(); // Selected character sheet template for keeper view
}
```

### API Endpoints
```typescript
// GET /api/character-sheets?system={siteSystem}
// Returns available character sheets filtered by system
interface CharacterSheetListResponse {
  sheets: Array<{
    key: string;
    name: string;
    system: string;
    // other relevant metadata
  }>;
}
```

**Dependencies:**
- Character Keeper is only available when `useCharacters` is `true`
- `useCharacterKeeper` can only be enabled if `useCharacters` is already enabled
- If `useCharacters` is disabled, `useCharacterKeeper` should be automatically disabled

### Routes & Pages
- `src/pages/sites/[sitekey]/keeper.astro` - Character Keeper page (authenticated)
- `src/pages/api/character-sheets.ts` - API endpoint to fetch character sheets by system
- Uses `PageWithTray.astro` layout with standard site tray integration

### Components
- `CharacterKeeperApp.svelte` - Main container component with selected sheet template display and cache management
- `KeeperCharacterCard.svelte` - Character display component using selected sheet template
- `CharacterKeeperSettings.svelte` - Configuration UI for activation and sheet selection (site owners only)
- `CharacterSheetSelector.svelte` - Dropdown/picker that fetches available sheets by system via API
- **Standard Site Tray Integration**: Uses existing site tray components and navigation patterns

### Stores & Data Management
- `characterKeeperStore.ts` - Manages collection of characters for a site with stale-while-revalidate caching
- `selectedCharacterSheetStore.ts` - Stores only the selected character sheet template for the site
- **Character Sheets API**: Fetches available character sheets by system via API endpoint (no store needed)
- **Stale-While-Revalidate Pattern**: Uses locally stored cached data with background updates for optimal performance
- **Local Storage Integration**: Persists character data locally to provide instant loading
- **Background Sync**: Real-time Firestore subscriptions update cached data in background
- Integrates with existing character schema and character sheet collection patterns

### Authentication Pattern
```typescript
// In Astro page
const session = await verifySession(Astro);
if (!session?.uid) {
  return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}

// Verify site access permissions and feature availability
const site = await getSite(sitekey);
if (!site?.useCharacters) {
  return new Response('Characters feature not enabled', { status: 404 });
}
if (!site?.useCharacterKeeper) {
  return new Response('Character Keeper feature not enabled', { status: 404 });
}

const siteAccess = await verifySiteAccess(sitekey, session.uid);
if (!siteAccess.isMember) {
  return new Response('Forbidden', { status: 403 });
}
```

## Out of Scope (Future Enhancements)

- **Character Editing**: Direct editing capabilities from the keeper view
- **Advanced Filtering**: Search, filter, or sort characters
- **Custom Character Sheet Creation**: Creating new character sheet templates within the keeper
- **Advanced Sheet Customization**: Modifying selected character sheet layouts specifically for keeper use
- **Export Features**: PDF export or printing capabilities
- **Notifications**: Alerts when characters are updated
- **Integration with Other Tools**: Dice rolling, combat tracking, etc.

## Implementation Steps

### Phase 1: Core Infrastructure
- [x] **Extend Site Schema**: Add `useCharacterKeeper` and `characterKeeperSheetKey` fields to Site schema
- [x] **Feature Dependency Logic**: Implement `useCharacters` dependency for Character Keeper activation
- [x] **Create Route & Page**: Build authenticated Character Keeper page with feature checks
- [x] **Basic Authorization**: Implement site membership access control and feature availability checks
- [x] **Character Collection Store**: Create store with stale-while-revalidate pattern for character caching
- [x] **Local Storage Integration**: Implement persistent caching for character data
- [x] **Character Sheets API**: Create API endpoint to fetch character sheets by system
- [x] **Selected Sheet Store**: Create simple store to hold the selected character sheet for the site

### Phase 2: Character Sheet Selection & Display  
- [x] **Character Sheet Selector**: Build UI component that fetches available sheets via API by site system
- [x] **Character Keeper App**: Build main Svelte component with selected sheet display and cache management
- [x] **Keeper Character Card**: Create read-only character display using selected sheet template
- [x] **Stale-While-Revalidate Implementation**: Implement background Firestore sync with local storage caching
- [x] **Sheet Template Rendering**: Integrate selected character sheet template into character display
- [x] **Site Tray Integration**: Ensure proper integration with standard site tray navigation

### Phase 3: Site Integration & Configuration
15. **Character Sheets API Implementation**: Create API endpoint to query sheets by system
16. **Keeper Settings**: Add activation toggle and API-based sheet selection to site settings (site owners only)
17. **Navigation Integration**: Add Character Keeper link to site navigation (visible to all members when both features enabled)
18. **Configuration Persistence**: Save character sheet selection in `characterKeeperSheetKey` field
19. **Feature Dependency UI**: Prevent enabling Character Keeper when Characters is disabled
20. **Empty States**: Handle sites with no characters or no available character sheets for the system
21. **Error Handling**: Implement proper error boundaries and API error handling

### Phase 4: Testing & Polish
- [x] **Unit Tests**: Test character keeper store with caching, selected sheet store, and components
- [x] **API Testing**: Test character sheets API filtering by system, error scenarios
- [x] **Cache Testing**: Test stale-while-revalidate behavior, offline scenarios, and cache invalidation  
- [x] **E2E Tests**: Test full user flow including API-based sheet selection, caching, and character viewing
- [x] **Performance Testing**: Verify instant loading with cached data and efficient API calls
- [x] **Responsive Design**: Verify layout works across device sizes with site tray integration
- [x] **Sheet Selection Testing**: Verify API fetches correct sheets by system and updates display
- [x] **Offline Testing**: Ensure graceful degradation when network is unavailable

## Non-Functional Requirements

### Performance
- Page must load instantly using cached data (target: < 100ms for cached content)
- Fresh data should load in background within 2 seconds with up to 20 characters
- Stale-while-revalidate pattern minimizes perceived loading time
- Efficient Firestore queries to minimize read operations
- Local storage usage optimized to prevent excessive memory consumption
- Cache invalidation strategy prevents serving overly stale data

### Security
- All character data access properly authorized through site ownership
- No character data exposed to unauthorized users
- Proper session validation on page access

### Accessibility
- Screen reader friendly character information layout
- Keyboard navigation support
- Proper ARIA labels for read-only content

### Testing
- Unit tests for all new Svelte components using Vitest
- E2E tests covering full user workflow using Playwright:
  1. Site owner logs in and configures features
     - Enables Characters feature (`useCharacters`)
     - Activates Character Keeper feature (`useCharacterKeeper`)
     - Selects a character sheet template for the keeper view
  2. Site member (player) logs in
  3. Player navigates to Character Keeper page
  4. Player views all site characters using the selected sheet template
  5. Verifies real-time updates when characters change
  6. Site owner changes character sheet template and verifies display updates for all users
  7. Verifies Character Keeper becomes unavailable when Characters feature is disabled
  8. Verifies non-site members cannot access Character Keeper

## Dependencies

- Existing character schema and character collection patterns
- Existing character sheet schema and collection patterns (for API queries)
- Site authentication and authorization patterns
- Real-time Firestore subscription utilities
- **Character sheets API** for system-based filtering (to be created)
- **Nanostores persistent atoms** for local storage caching implementation
- **Standard site tray** components and navigation patterns
- Character sheet rendering components and logic
- Cyan Design System components for layout and styling

## Priority

**Medium** - Enhances GM experience and provides valuable oversight functionality, but not critical for core platform operation

## Estimated Effort

**2-3 sprints** - Requires new page creation, real-time data subscriptions, specialized UI components, and comprehensive testing across authentication, authorization, and real-time functionality

## Definition of Done

- [x] Character Keeper page accessible to all authenticated site members
- [x] Character Keeper feature only available when Characters feature is enabled
- [x] Site owners can activate/deactivate Character Keeper feature (`useCharacterKeeper`)  
- [x] Site owners can select character sheet template for keeper view
- [x] Selected character sheet template persisted per site (`characterKeeperSheetKey`)
- [x] All site characters displayed using selected sheet template in read-only format
- [x] Feature dependency properly enforced in UI and server-side validation
- [x] Stale-while-revalidate caching provides instant page loads
- [x] Background sync updates work correctly when characters are modified  
- [x] Offline functionality gracefully shows cached data
- [x] Standard site tray integration provides consistent navigation
- [x] Responsive design works on desktop and tablet
- [x] Unit and E2E tests pass including cache behavior
- [x] Performance meets specified requirements
- [x] Error handling provides clear user feedback
- [x] Code follows project patterns and conventions