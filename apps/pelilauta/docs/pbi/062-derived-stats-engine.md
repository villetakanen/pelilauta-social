# PBI-062: Feature: Derived Stats Engine

**Epic:** [L&L Character Creation Support](../epics/lnl-character-creation.md)
**Spec Reference:** [Character Sheet System Spec](../../plans/character-sheets/spec.md)

## User Story
To automate character creation math (e.g., `HP = Con + Level`), the Character Sheet engine needs to actively evaluate `DerivedStat` formulas.

## Context
The schema currently supports `derived` stats with a `formula` field, but the logic to parse and calculate them is missing. The values do not update when their dependencies change.

## Acceptance Criteria
1.  **Logic Implementation**:
    -   Create `calculateDerivedStats(character, sheet)` utility in `characterStore`.
    -   Implement a safe formula parser that supports basic arithmetic (`+`, `-`, `*`, `/`, `floor`, `ceil`) and references (`@stat_key`).
2.  **Reactivity**:
    -   Trigger recalculation inside `characterStore.update()` whenever a dependency stat changes.
    -   Persist the calculated value to `character.stats` (or compute lazily if preferred, but persisting allows for easier querying).
3.  **UI Update**:
    -   Frontend displays the calculated value in `Stat.svelte` as read-only.

## Technical Notes
-   **Security**: Do NOT use `eval()`. Use a restricted parser or a library like `mathjs` (or a simple custom regex parser if scope allows).
-   **Cycle Detection**: Prevent infinite loops if A depends on B and B depends on A (fail gracefully).
