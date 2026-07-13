---
name: "Planned Changes and Features for the 17.x.x release"
shortname: 'Planned Changes'
noun: 'monsters'
---
## Version 17.12.0
- FEAT: Add site setting for enabling/disabling display of characters linked to the site.
- FEAT: Add site tray link to site characters, visible if the site setting to display characters is enabled.
- FEAT: Create an api route for /api/sites/:siteId/characters, which returns all characters linked to a specific site. Use cache of a 30s, and stale-while-revalidate strategy.
- FEAT: Create a route for site characters, allowing users to view all characters linked to a specific site. The route should simply load the characters server-side, and display them in a card-list in an astro component (character-card is a svelte component, client:only).
- FEAT: A FAB (Floating Action Button) for quickly adding new characters to a site. The FAB is visible on the site characters page, for players and owners of the site. The FAB is a link to the new character form, with the siteId prefilled in the form.


