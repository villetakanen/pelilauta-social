import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]))
  : new URL('../.netlify/build/entry.mjs', import.meta.url);
const source = await readFile(entry, 'utf8');

if (/from\s+['"]@astrojs\/netlify(?:\/|['"])/.test(source)) {
  throw new Error(
    'Netlify SSR entry must bundle the adapter instead of importing it at runtime',
  );
}

console.log(`OK: ${entry.pathname}`);
