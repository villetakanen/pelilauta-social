/**
 * sync-proprietary-assets.mjs
 *
 * The @myrrys/proprietary submodule now lives at packages/myrrys-proprietary
 * (workspace package for the icon registry). Legacy pages still reference its
 * image assets by URL as /myrrys-proprietary/<folder>/<file>. Astro serves
 * static files from public/ and copies public/ into the build without
 * dereferencing symlinks, so we materialize the asset folders as real files
 * under public/myrrys-proprietary/ before dev and build. The target is
 * gitignored; the submodule remains the single source of truth.
 *
 * Only non-code folders are copied. The icon registry (icons/, index.ts,
 * package.json, README.md) is consumed as a package import, not over HTTP.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../../packages/myrrys-proprietary");
const target = resolve(here, "../public/myrrys-proprietary");

const EXCLUDE = new Set([
  "icons",
  "index.ts",
  "package.json",
  "README.md",
  "tsconfig.json",
  "node_modules",
  ".git",
  ".gitignore",
  ".DS_Store",
]);

if (!existsSync(source)) {
  // The proprietary submodule is optional (review BLOCKER 1): if it is not
  // checked out, warn and skip asset sync rather than failing the build. The
  // Icon component degrades to its bundled fallback, and legacy pages that
  // reference /myrrys-proprietary/*.webp lose only that branded artwork.
  console.warn(
    `[sync-proprietary-assets] missing ${source}; skipping. Run: git submodule update --init packages/myrrys-proprietary`,
  );
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

let copied = 0;
for (const entry of readdirSync(source)) {
  if (EXCLUDE.has(entry)) continue;
  cpSync(join(source, entry), join(target, entry), {
    recursive: true,
    dereference: true,
  });
  copied += 1;
}

console.log(`[sync-proprietary-assets] copied ${copied} asset folder(s) to public/myrrys-proprietary`);
