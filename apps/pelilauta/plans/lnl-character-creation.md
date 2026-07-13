# L&L Character Creation Plan

## 1. Overview
This document outlines the plan to implement full character creation support for **Legendoja & Lohikäärmeitä** (L&L) in the Pelilauta application. Currently, the character creation wizard is generic and does not support the specific 7-step flow (Species, Background, Class, Stats, Alignment, Equipment, Final Details) required for L&L.

## 2. Gap Analysis
*   **Missing Data**: The specific Rules Data (Species, Classes, Backgrounds) for L&L is not present in the database or the codebase as structured data.
*   **Generic UI**: The current `CreateCharacterWizard` supports selecting a System and a Sheet (template), but does not provide the interactive "Builder" experience needed to select Species, Class, etc., and apply their effects.
*   **No "Builder" Logic**: There is no logic to calculate derived stats (HP, AC) based on choices (Class + CON mod, Armor + DEX mod).

## 3. Implementation Strategy

### 3.1. Data Layer: Rules Storage
We will store the L&L Rules Data in Firestore to allow for dynamic updates and potential sharing.
*   **Collection**: `systems` (or `assets/rules/systems`)
*   **Document**: `ll` (representing the L&L system)
*   **Sub-data**:
    *   `species`: List of species definitions.
    *   `classes`: List of class definitions.
    *   `backgrounds`: List of background definitions.
    *   `equipment`: (Optional) Standard equipment bundles.

### 3.2. Data Model (TypeScript Interfaces)
We will define Types for these entities in `src/types/ll.ts` (or similar) to ensure type safety in the UI.

### 3.3. UI: L&L Character Builder
We will create a specialized Wizard component: `LnlCharacterWizard.svelte`.
*   **Integration**: In the existing `CreateCharacterWizard`, if `system === 'll'`, we will switch to this specialized wizard.
*   **Flow**:
    1.  **Species**: Fetch and display Species. selection updates `character.stats` (e.g., `species: 'elf'`, `speed: 12`).
    2.  **Background**: Fetch and display Backgrounds. Selection adds skills/equipment to `character.stats`.
    3.  **Class**: Fetch and display Classes. Selection defines `hit_die`, `saving_throws`.
    4.  **Stats**: Implement Point Buy and Rolling methods.
    5.  **Alignment**: Dropdown selection.
    6.  **Equipment**: Selection of starting gear.
    7.  **Review**: Auto-calculate derived stats (HP, AC, Initiative).

### 3.4. Initialization Script
A script `scripts/init-ll-data.ts` will be created to populate the Firestore `systems/ll` document with the data provided in the specification.

## 4. Work Breakdown
1.  **Scripting**: Create and run `scripts/init-ll-data.ts` to seed the database.
2.  **Types**: Define `LnlSpecies`, `LnlClass`, `LnlBackground`.
3.  **UI Components**: Build the steps for the `LnlCharacterWizard`.
4.  **Logic**: Implement the stat calculation logic.
