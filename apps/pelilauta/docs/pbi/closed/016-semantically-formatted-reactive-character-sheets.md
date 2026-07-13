# PBI 016: Semantically Formatted Reactive Character Sheets

**User Story:** As a user, I want a functional character sheet where I can view and edit basic stats (text, number, toggled), so that I can manage my character's information reliably for gameplay.

## Current Situation

The current character sheet implementation is a prototype that partially works but has critical functional gaps preventing release:

**Working Components:**
- `CharacterApp.svelte`: Basic container and layout
- `StatBlock.svelte`: Groups stats visually
- `TextStat.svelte`: Functional text editing (good pattern to extend)

**Critical Issues for Release:**
- **Incomplete stat support**: Only `text` stats work properly; `number` and `toggled` stats have broken or inconsistent editing
- **Mixed edit/view logic**: `Stat.svelte` has hardcoded rendering for each type instead of reusable components  
- **No error handling**: Failed saves or validation issues are not communicated to users
- **Inconsistent UX**: Different stat types behave differently in edit mode

## Acceptance Criteria

### Release-Critical Functionality
1.  **Complete Basic Stat Types:** All three core stat types must work reliably:
    - **Text stats**: Editable text inputs with auto-save on change ✅ (already working)
    - **Number stats**: Editable number inputs with proper validation and auto-save
    - **Toggled stats**: Clickable checkboxes that save state changes immediately
2.  **Consistent Edit Behavior:** All stat types follow the same interaction pattern:
    - Click to edit (or always editable for stat owners)
    - Auto-save on `change` event
    - Visual feedback during save operations
    - Error handling for failed saves
3.  **Reliable State Management:** Character data updates correctly:
    - Local state reflects server changes
    - Optimistic updates with rollback on failure
    - No data loss during concurrent edits

### UI/UX Requirements
4.  **Clear Edit/View Distinction:** Users can clearly tell when stats are editable vs. read-only
5.  **Responsive Feedback:** Users get immediate confirmation when changes are saved or if errors occur
6.  **Maintain Reactivity:** Character sheet updates automatically when data changes from other sources

## Out of Scope

- **Advanced stat types**: `d20_ability_score` and `derived` stat types are not required for this release
- **Semantic HTML improvements**: While beneficial, `<form>`, `<fieldset>`, and `<legend>` elements are secondary to functional requirements
- **Backend changes**: No database schema or API modifications needed
- **Advanced features**: Bulk operations, undo/redo, offline support

## Implementation Notes

- The view mode must remain reactive for logged-in users. The client-side Svelte component should subscribe to real-time Firestore updates via the `characterStore`.
- If character sheets are ever made public for anonymous users, the component should gracefully fall back to using the static data rendered by the server, without initiating a live subscription.

## Review Findings & Strategy

### Functional Analysis (Release Blockers)
1. **`CharacterApp.svelte`**: ✅ Container works, renders StatBlock components
2. **`StatBlock.svelte`**: ✅ Basic grouping works
3. **`Stat.svelte`**: ❌ **BROKEN** - Number and toggled stats have incomplete/broken editing logic
4. **`TextStat.svelte`**: ✅ **WORKS** - Good pattern, can be extended to other types
5. **`CharacterHeader.svelte`**: ⚠️ Edit link goes to separate route instead of inline editing
6. **Character Store**: ✅ Store functionality works for updates

### Release-Blocking Issues
- **`number` stats**: Input exists but missing proper `onchange` handler and validation
- **`toggled` stats**: Checkbox exists but not connected to save logic  
- **Error handling**: No user feedback when saves fail
- **Inconsistent patterns**: Each stat type has different implementation approach
- **Missing validation**: No input validation or type coercion for number stats

### Implementation Priority Order

**Phase 1: Release-Critical Fixes (HIGH PRIORITY)**
1. **Fix `number` stat editing**: Add proper `onchange` handler and number validation to `Stat.svelte`
2. **Fix `toggled` stat editing**: Connect checkbox changes to save logic in `Stat.svelte`  
3. **Add error handling**: Display save failures and validation errors to users
4. **Standardize save behavior**: Ensure all three stat types use consistent `change` event handling
5. **Add loading states**: Show visual feedback during save operations

**Phase 2: UX Polish (MEDIUM PRIORITY)**
6. **Consistent edit patterns**: Refactor to use shared component patterns like `TextStat.svelte`
7. **Improve edit indicators**: Clear visual distinction between editable/read-only states
8. **Add input validation**: Prevent invalid data entry for number stats

**Phase 3: Technical Debt (LOW PRIORITY)**  
9. **Unit tests**: Add vitest tests for stat editing logic
10. **E2E tests**: Add Playwright test for basic editing workflow
11. **Semantic HTML**: Add `<form>`/`<fieldset>` structure when time permits

### Technical Considerations
- **Release quality**: Focus on making basic functionality robust rather than adding advanced features
- **Error resilience**: All stat editing must handle network failures gracefully
- **Data integrity**: Prevent corruption from invalid number inputs or concurrent edits
- **User feedback**: Every user action should have clear visual confirmation or error messaging
- **Performance**: Avoid excessive API calls while maintaining responsive auto-save

## Proposed Implementation Steps

### Immediate Release Fixes
1.  **Fix `Stat.svelte` number handling**: Add proper `onchange` handler and number coercion for number type stats
2.  **Fix `Stat.svelte` toggle handling**: Connect checkbox `onchange` to the `updateStat` function for toggled stats  
3.  **Add error boundaries**: Wrap save operations in try/catch and display errors to users
4.  **Test all three stat types**: Verify text, number, and toggled stats all save correctly

### Follow-up Improvements  
5.  **Extract reusable components**: Create `NumberStat.svelte` and `ToggledStat.svelte` following `TextStat.svelte` pattern
6.  **Add validation**: Prevent invalid number inputs and provide user feedback
7.  **Improve visual feedback**: Loading states and success confirmations for saves

## Non-Functional Requirements

-   **Testing**: All new Svelte components (`CharacterSheetForm`, `StatInput`) must have corresponding unit tests written with `vitest`. An end-to-end test using Playwright should be created to cover the entire user flow:
    1.  Navigate to a character page.
    2.  Click the "Edit" button.
    3.  Change the value of a `text`, `number`, and `toggled` stat.
    4.  Verify each stat saves automatically on change (no manual save needed).
    5.  Verify that the new values are displayed correctly when switching back to view mode.

## Ready for Implementation
✅ **Release Focus** - Prioritized functional requirements over semantic polish  
✅ **Clear Blockers** - Identified specific broken functionality in `Stat.svelte`  
✅ **Minimal Scope** - Focus on getting 3 core stat types working reliably  
⏳ **Next Step**: Fix number and toggled stat editing in `Stat.svelte` component

### Definition of Done
- [ ] Text stats: Continue working as they do now ✅ 
- [ ] Number stats: Input validation, proper save on change, error handling
- [ ] Toggled stats: Checkbox saves state changes, visual feedback  
- [ ] All stat types: Consistent error handling and user feedback
- [ ] Manual testing: Verify all three types work end-to-end
