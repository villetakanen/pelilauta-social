---
name: "Sites, games and Campaigns"
shortname: 'Sites'
noun: 'veil-advance'
---
The Sites app is a progenitor of Mekanismi.sange.fi wiki and is designed to support the creation of sites, games, and campaigns. It provides a flexible structure for organizing content and allows users to create and manage their own sites.

## Code organization

The code for the Sites app is organized into several key components:
- @server/sites/** - Server-side code for handling site data, including API endpoints and database interactions.
- @svelte/sites/** - Client-side code for the user interface and interactions.
- @stores/sites/** - State management for site app specific data using Svelte stores.

> N.B. Some code is still in the process of being refactored and moved to these directories owned by the Sites app.

## Data structure

The Firestore data structure is following:
```yaml
- sites/[key]
  - pages/[pageKey] # Page data
  - assets/[assetKey] # Asset metadata
  - handouts/[handoutKey] # Handout data
  - history/[pageKey] # Page history diffs
  - characters/[characterKey] # (Optional) Character data
```

### Key fields

| Field | Type | Description |
|-------|------|-------------|
| `updatedAt` | `timestamp` | The last time the site, or it's pages, assets, or handouts were updated (including created pages, assets and handouts)|