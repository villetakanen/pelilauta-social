# Version Info Is Not Wired

Status: Recorded 2026-07-31, unstarted

## What is wrong

The root `package.json` carries the release version, and nothing reads it.

- `apps/pelilauta/package.json` still says `18.13.3`, the version of the imported
  v18 baseline. It has not moved since the import and no longer means anything.
- Both locales define `app.version: 'Versio'` / `'Version'`. Nothing consumes
  either key, so the label exists for a version display that isn't there.
- No source file in either application imports a version from any `package.json`.

## What done looks like

Both applications show the root version, from the root `package.json`, so a reader
can say which release they are looking at and a bug report can name it. Nested
package versions keep whatever meaning they have; they are not the release
identity.
