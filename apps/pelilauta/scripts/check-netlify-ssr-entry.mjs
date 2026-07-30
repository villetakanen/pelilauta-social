import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const entry = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]))
  : new URL('../.netlify/build/entry.mjs', import.meta.url);
const source = await readFile(entry, 'utf8');

if (/from\s+['"]@astrojs\/netlify(?:\/|['"])/.test(source)) {
  throw new Error(
    'Netlify SSR entry must bundle the adapter instead of importing it at runtime',
  );
}

/*
 * Every bare import left in the SSR output has to be resolvable from inside the
 * deployed function at runtime, or the route 500s with ERR_MODULE_NOT_FOUND.
 *
 * This is not hypothetical: a deploy shipped a function without `firebase`,
 * `firebase-admin`, and `marked`, and Netlify still reported the deploy ready
 * and "Site is live". Nothing failed until a request arrived. A green deploy
 * status is not evidence that the function loads, so assert it here instead —
 * in the same build that produces the artifact.
 */
const buildDir = new URL('../.netlify/build/', import.meta.url);
const functionRoot = new URL('../.netlify/v1/functions/ssr/', import.meta.url);

async function collectMjs(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const item of entries) {
    const child = new URL(`${item.name}${item.isDirectory() ? '/' : ''}`, dir);
    if (item.isDirectory()) found.push(...(await collectMjs(child)));
    // Astro's content-layer chunks are serialized *data*, not executable code.
    // Documentation pages quote import statements in code fences, so scanning
    // them yields specifiers that are never imported at runtime.
    else if (
      item.name.endsWith('.mjs') &&
      !item.name.startsWith('_astro_data-layer-content')
    ) {
      found.push(child);
    }
  }
  return found;
}

/*
 * Match `from "x"` and `import("x")`. The output is minified JS, so string
 * literals elsewhere can look import-shaped; every candidate is therefore
 * validated against the npm package-name grammar below rather than trusted.
 */
const FROM_IMPORT = /\bfrom\s*["']([^"']+)["']/g;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

// Scoped or unscoped npm name, optionally followed by a subpath.
const PACKAGE_NAME =
  /^(?:@[a-z0-9][a-z0-9-._]*\/)?[a-z0-9][a-z0-9-._]*(?:\/[^\s"']*)?$/;

function packageNameOf(specifier) {
  // Relative, absolute, builtin, subpath-import, and URL specifiers never need
  // to be shipped as packages.
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    specifier.startsWith('node:') ||
    specifier.includes(':')
  ) {
    return null;
  }
  if (!PACKAGE_NAME.test(specifier)) return null;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/*
 * Strip comments before scanning. Svelte's own server runtime carries JSDoc
 * `@import { Component } from 'svelte'` annotations, which are type-only and
 * never imported at runtime — counting them reported `svelte` as a missing
 * dependency that nothing actually needs.
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

const required = new Set();
for (const file of await collectMjs(buildDir)) {
  const text = stripComments(await readFile(file, 'utf8'));
  for (const pattern of [FROM_IMPORT, DYNAMIC_IMPORT]) {
    for (const match of text.matchAll(pattern)) {
      const name = packageNameOf(match[1]);
      if (name) required.add(name);
    }
  }
}

// Node builtins are always available; everything else must ship with the function.
const builtins = new Set(
  (await import('node:module')).builtinModules.map((m) =>
    m.replace(/^node:/, ''),
  ),
);

const functionDir = fileURLToPath(functionRoot);

/*
 * Check only the function's own top-level node_modules — deliberately without
 * walking up the way Node would here. At runtime the function root *is* the
 * filesystem root (`/var/task`), so a repository node_modules further up exists
 * only on a developer machine. Walking up would make this check pass locally for
 * exactly the dependency that is missing in the deploy.
 */
const missing = [];
for (const name of [...required].sort()) {
  if (builtins.has(name)) continue;
  try {
    await stat(resolve(functionDir, 'node_modules', name, 'package.json'));
  } catch {
    missing.push(name);
  }
}

if (missing.length > 0) {
  throw new Error(
    `Netlify SSR function is missing runtime dependencies: ${missing.join(', ')}\n` +
      `They are imported by the SSR output but absent from ${functionDir}node_modules.\n` +
      'Either bundle them via vite.ssr.noExternal, or ensure the function ships them.',
  );
}

console.log(
  `OK: ${entry.pathname} (${required.size} imports checked, all resolvable)`,
);
