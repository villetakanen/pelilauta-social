# Character Sheet System Specification

## 1. Overview
The **Character Sheet System** is a data-driven framework that decouples the *definition* of a character's capabilities (template) from the *data* of a specific character instance.

It allows the application to support multiple game systems (D&D 5e, PBTA, etc.) by defining different templates ("Sheets") without changing the application code.

## 2. Architecture: Template vs. Instance

### 2.1 Character Sheet (Template)
Defined in `CharacterSheetSchema`. This is a "Class" or "Blueprint".
-   **Source**: Firestore collection `charsheets`.
-   **Purpose**: Defines *what* stats a character has, how they are grouped, and their data types.
-   **Immutable**: The definition does not change when a user edits a character.

```typescript
type CharacterSheet = {
  key: string;         // e.g. "dnd5e-standard"
  name: string;        // e.g. "D&D 5th Edition"
  system: string;      // e.g. "dnd5e"
  statGroups: Array<{
    key: string;       // e.g. "Attributes"
    layout: 'rows' | 'grid-2' | 'grid-3';
  }>;
  stats: CharacterStat[];
};
```

### 2.2 Character (Instance)
Defined in `CharacterSchema`. This is the "Object" or "Instance".
-   **Source**: Firestore collection `characters`.
-   **Purpose**: Stores the *actual values* for a specific user's character.
-   **Reference**: Links to a sheet via `sheetKey`.

```typescript
type Character = {
  key: string;
  name: string;
  sheetKey: string;    // References the Template
  stats: Record<string, string | number | boolean>; // Key-Value storage
  // ... other metadata
};
```

## 3. Supported Stat Types
The system supports specific primitives defined in `CharacterStatSchema`.

| Type | Data Type | UI Component | Description |
| :--- | :--- | :--- | :--- |
| `number` | `number` | `<input type="number">` | Simple integer value. |
| `text` | `string` | `<input type="text">` | Free-form text (e.g., "Alignment"). |
| `toggled` | `boolean` | `<input type="checkbox">` | Boolean switch (e.g., "Inspiration"). |
| `d20_ability` | `number` | `<cn-d20-ability-score>` | D&D style score (10) + modifier (+0). Stored as base value. |
| `derived` | `any` | *Read Only* | Defined with a `formula`, but currently behaves as static/placeholder in UI. |

## 4. Derived Stats (Current Limitation)
While `DerivedStatSchema` exists with a `formula` field (e.g., `@strength_modifier + 2`), the **Logic Engine** to evaluate these formulas is **currently unimplemented**.
-   The Schema validates the definition.
-   The UI renders the Value.
-   *Missing*: The Reactivity to recalculate the value when dependencies change.

## 5. UI Rendering
The `CharacterApp` component orchestrates the view:
1.  Loads `Character` doc.
2.  Loads `CharacterSheet` doc (based on `sheetKey`).
3.  Iterates `sheet.statGroups`.
4.  For each group, filters `sheet.stats` belonging to it.
5.  Renders the appropriate component (`NumberStat`, etc.) binding to `character.stats[key]`.

## 6. Known Gaps for Advanced Systems (e.g. L&L)
1.  **Selection Support**: No strict "Choice" type (select from list).
2.  **Formula Engine**: Formulas are static strings; no calculation.
3.  **Data Linking**: No built-in way to fetch options from an external collection (e.g., picking a stored "Spell").
