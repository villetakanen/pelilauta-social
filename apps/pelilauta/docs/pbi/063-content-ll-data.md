# PBI-063: Content: L&L Rules Data Injection

**Epic:** [L&L Character Creation Support](../epics/lnl-character-creation.md)
**Spec Reference:** [L&L Character Creation Plan](../../docs/epics/lnl-character-creation.md)

## User Story
To allow users to create Legendoja & Lohikäärmeitä characters, the system must be populated with the core rules data (Species, Classes, Backgrounds).

## Context
The application needs the reference data for the 5e-compatible "Legendoja & Lohikäärmeitä" system to power the `SelectStats` defined in PBI-061.

## Acceptance Criteria
1.  **Data Seeding Script**:
    -   Create `scripts/init-ll-data.ts`.
    -   Populate `systems/ll` document.
    -   Populate sub-collections: `species`, `classes`, `backgrounds`.
2.  **Data Quality**:
    -   Entities match the structure required by the UI (name, key, modifiers/features).
    -   Includes OGL content specified in the plan (Elves, Dwarves, Fighter, Wizard, etc.).
3.  **Execution**:
    -   Running the script successfully updates Firestore without errors.

## Technical Notes
-   Use `firebase-admin` for the script.
-   Ensure keys are consistent (e.g., `species/haltia` matches what the Sheet expects).
