// A Node module-resolution hook, self-registered via `--import`.
//
// The seed scripts import the application's own zod schemas so the seed cannot
// drift from what the application reads. Those schema files resolve their own
// internal imports the way Astro's Vite build does: bare specifiers such as
// `src/utils/schemaHelpers`, and relative specifiers with no file extension.
// Plain Node ESM resolves neither. This hook rewrites both against
// `apps/pelilauta/src` before handing resolution back to Node, so the schema
// files load unmodified outside their usual bundler.
import { existsSync } from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

register(import.meta.url);

const appSrc = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../apps/pelilauta/src',
);

// The `@`-prefixed aliases from `apps/pelilauta/tsconfig.json` that point into
// `src/`. A schema reaches its neighbours through these as readily as through a
// bare `src/` specifier, and Node resolves neither.
const SRC_ALIASES = {
  '@components/': 'components/',
  '@svelte/': 'components/svelte/',
  '@layouts/': 'layouts/',
  '@pages/': 'pages/',
  '@schemas/': 'schemas/',
  '@stores/': 'stores/',
  '@styles/': 'styles/',
  '@locales/': 'locales/',
  '@firebase/': 'firebase/',
  '@utils/': 'utils/',
  '@pelilauta/': '',
};

const CANDIDATE_EXTENSIONS = ['.ts', '.js', '.mjs', '/index.ts', '/index.js'];

function resolveOnDisk(basePath) {
  if (path.extname(basePath) && existsSync(basePath)) return basePath;
  for (const extension of CANDIDATE_EXTENSIONS) {
    const candidate = basePath + extension;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let basePath = null;
  const alias = Object.keys(SRC_ALIASES).find((prefix) =>
    specifier.startsWith(prefix),
  );
  if (specifier.startsWith('src/')) {
    basePath = path.join(appSrc, specifier.slice('src/'.length));
  } else if (alias) {
    basePath = path.join(
      appSrc,
      SRC_ALIASES[alias],
      specifier.slice(alias.length),
    );
  } else if (
    specifier.startsWith('.') &&
    context.parentURL?.startsWith('file://')
  ) {
    basePath = path.join(
      path.dirname(fileURLToPath(context.parentURL)),
      specifier,
    );
  }
  if (basePath) {
    const resolved = resolveOnDisk(basePath);
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
