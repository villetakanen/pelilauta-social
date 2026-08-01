/**
 * cut-fonts.mjs
 *
 * Cuts every face in `scripts/font-manifest.mjs` from its source face down to the
 * manifest's coverage ranges, and writes it to `fonts/` as woff2.
 *
 * The cut files are committed. This script exists so they are reproducible from a
 * stated source rather than trusted, which is what `specs/design-system/fonts/spec.md`
 * asks of a shipped face: the published families carry Cyrillic, Greek, Vietnamese and
 * IPA that neither application renders, at roughly six times the bytes.
 *
 * Cutting is not byte-reproducible — the subsetter and its brotli encoder are free to
 * change output between versions — so `--check` verifies that every face the manifest
 * declares has a file and a resolvable source, not that a re-cut would produce the
 * same bytes. What the stylesheet claims about those files is test/fonts.test.ts's,
 * and whether a browser can load them is apps/design/e2e/fonts.spec.ts's.
 *
 * Run:   node scripts/cut-fonts.mjs
 * Check: node scripts/cut-fonts.mjs --check
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { FACES, RANGES } from './font-manifest.mjs';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'fonts');

/**
 * Every code point a range covers, as text. The subsetter takes characters rather
 * than ranges; code points the source face does not have are simply not kept, so
 * expanding the whole range is safe and keeps the range definition authoritative.
 */
function codepoints(range) {
  let text = '';
  for (const part of range.split(',')) {
    const [from, to] = part.trim().replace(/^U\+/, '').split('-');
    const start = Number.parseInt(from, 16);
    const end = to === undefined ? start : Number.parseInt(to, 16);
    for (let cp = start; cp <= end; cp++) text += String.fromCodePoint(cp);
  }
  return text;
}

const TEXT = Object.fromEntries(
  Object.entries(RANGES).map(([name, range]) => [name, codepoints(range)]),
);

function sourcePath(face) {
  try {
    return require.resolve(face.source);
  } catch {
    throw new Error(
      `${face.file}: source ${face.source} does not resolve. Is its package installed?`,
    );
  }
}

async function cut(face) {
  const source = readFileSync(sourcePath(face));
  return subsetFont(source, TEXT[face.range], { targetFormat: 'woff2' });
}

if (process.argv.includes('--check')) {
  const stale = [];
  for (const face of FACES) {
    sourcePath(face);
    const target = join(outDir, face.file);
    if (!existsSync(target)) stale.push(`${face.file}: missing`);
    else if (statSync(target).size === 0) stale.push(`${face.file}: empty`);
  }
  if (stale.length > 0) {
    console.error(
      `STALE:\n  ${stale.join('\n  ')}\nRun: pnpm --filter @pelilauta/design-system cut:fonts`,
    );
    process.exit(1);
  }
  console.log(`OK: ${FACES.length} faces in fonts/`);
} else {
  mkdirSync(outDir, { recursive: true });
  let total = 0;
  for (const face of FACES) {
    const bytes = await cut(face);
    writeFileSync(join(outDir, face.file), bytes);
    total += bytes.length;
    console.log(`${face.file}  ${(bytes.length / 1024).toFixed(1)} KB`);
  }
  console.log(
    `Cut ${FACES.length} faces, ${(total / 1024).toFixed(0)} KB total.`,
  );
}
