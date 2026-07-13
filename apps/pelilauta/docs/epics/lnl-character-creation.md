# L&L Character Creation Support Plan

## 1. Overview
This plan outlines the strategy to add full support for **Legendoja & Lohikäärmeitä (L&L)** character creation by leveraging and extending the existing "Generic Character Sheet" system, rather than building a separate, siloed wizard.

## 2. Analysis & Gaps
The current system allows for defining Character Sheets with numeric/text stats, but lacks the necessary features for a "Builder" experience like L&L needs.
**Identified Gaps:**
1.  **No "Selection" Stats**: We cannot currently defined a "Species" or "Class" dropdown that pulls from a data source.
2.  **No "Derived" Stats**: While the Schema exists (`DerivedStat`), the logic to calculate these values (e.g., `HP = Con + Level`) is not implemented in the frontend.
3.  **Missing Data**: The L&L Rules (Species, Classes, Backgrounds) are not in the database.

## 3. Product Backlog Items (PBIs)
The work is broken down into the following atomic items:

-   [PBI-061: Selectable Character Stats (SelectStat)](../pbi/061-selectable-character-stats.md)
-   [PBI-062: Derived Stats Engine](../pbi/062-derived-stats-engine.md)
-   [PBI-063: Content: L&L Rules Data Injection](../pbi/063-content-ll-data.md)

## 4. Implementation Strategy

### 4.1. Phase 1: Engine Upgrades (The "Tools")
We will upgrade the core Character Engine to support the needs of complex systems like L&L.

#### A. Schema Enhancement: `SelectStat`
Add a new `SelectionStat` type to `CharacterSheetSchema`.
-   **Config**: `options` (static list) OR `ref` (dynamic reference, e.g., `systems/ll/species`).
-   **UI**: Renders as a `<select>` or `<Combobox>`.

#### B. Logic Implementation: Derived Stats
Implement the logic to calculate `DerivedStats`.
-   **Formula Parser**: A safe evaluator that resolves references like `@stats.constitution`.
-   **Reactivity**: When a dependency (e.g., Constitution) changes, auto-update the derived stat (e.g., HP).

### 4.2. Phase 2: L&L Data (The "Content")
We will define the L&L System using a "Code-First" approach (Seeding Script), which populates the Firestore.

#### A. Rules Data (`systems/ll`)
-   **Structure**: Collections for `species`, `classes`, `backgrounds`.
-   **Content**: Populate with the OGL data (Elves, Dwarves, Fighter, Wizard, etc.).
-   **Modifiers**: Each entity will define its effects (e.g., `Elf`: `dexterity_bonus: 2`).

#### B. Character Sheet Template (`charsheets/ll`)
Create the "master" definition for an L&L character.
-   **Stats**: `strength`, `dexterity`, etc. (using Point Buy logic or Manual Entry initially).
-   **Selections**: `species_select` (ref: `systems/ll/species`), `class_select` (ref: `systems/ll/classes`).
-   **Formulas**: `ac = @armor + @dexterity_modifier`.

### 4.3. Phase 3: UI Updates
-   Update `Stat.svelte` to support the new `SelectionStat`.
-   Update `CharacterApp` to run the Formula Evaluator.

## 5. Security Note
Formulas must be sanitized and run in a restricted context (no `eval` on arbitrary strings if possible, or use a math parser library) to prevent XSS/Injection.
