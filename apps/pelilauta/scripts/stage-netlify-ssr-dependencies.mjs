import { cp, mkdir, readdir, rm } from 'node:fs/promises';

const functionRoot = new URL('../.netlify/v1/functions/ssr/', import.meta.url);
const source = new URL('node_modules/', functionRoot);
const target = new URL('apps/pelilauta/node_modules/', functionRoot);
const entries = await readdir(source).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});

if (entries.length > 0 && !entries.includes('.pnpm')) {
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, force: true });
  await rm(source, { recursive: true });
}

const stagedEntries = await readdir(target).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});

if (stagedEntries.length === 0) {
  throw new Error(
    `Netlify SSR dependencies are missing from ${target.pathname}`,
  );
}

console.log(`OK: staged Netlify SSR dependencies in ${target.pathname}`);
