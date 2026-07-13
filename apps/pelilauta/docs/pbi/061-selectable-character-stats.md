# PBI-061: Feature: Selectable Character Stats (SelectStat)

**Epic:** [L&L Character Creation Support](../epics/lnl-character-creation.md)
**Spec Reference:** [Character Sheet System Spec](../../plans/character-sheets/spec.md)

## User Story
To support complex RPG rules where players must choose from a list (e.g., Species, Class, Skills), the Character Sheet engine needs a new `SelectStat` type.

## Context
Currently, the engine only supports simple primitives (`number`, `text`, `boolean`). We need to extend this to support "Choice" stats, where the valid values are constrained to a specific set of options, either static or dynamic.

## Acceptance Criteria
1.  **Schema Update**: `CharacterStatSchema` supports a new type `select`.
    -   Field `options`: Array of `{ label: string, value: string }`.
    -   Field `ref`: Optional string (Firestore collection path) for dynamic options.
2.  **UI Component**:
    -   `Stat.svelte` renders a `<select>` (or `<SelectStat>`) when `type === 'select'`.
    -   If `ref` is present, the component fetches the options from Firestore (e.g., `systems/ll/species`) on mount.
3.  **Validation**: Validates that the selected value is one of the available options.

## Technical Notes
-   Use `SelectStat.svelte` component to encapsulate the logic.
-   Ensure backward compatibility with existing sheets.
