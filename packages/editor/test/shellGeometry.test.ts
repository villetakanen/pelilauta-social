/**
 * The shell's inline geometry is composed from `content-golden`, not
 * restated — the one literal it does write, the stacking condition, has to
 * equal golden's wide-composition literal or the two drift apart width
 * by width. `CnEditorShell.svelte`'s comment names the design system file as
 * the source of truth, so this reads both from disk rather than asserting a
 * value either could have copied wrong.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const shellSource = readFileSync(
  join(packageRoot, 'CnEditorShell.svelte'),
  'utf8',
);
const contentContainersCss = readFileSync(
  join(packageRoot, '..', 'design-system', 'styles', 'content-containers.css'),
  'utf8',
);

const CONTAINER_QUERY = /@container \(min-width: ([\d.]+)rem\)/g;

function containerQueryValues(source: string): string[] {
  return [...source.matchAll(CONTAINER_QUERY)].map((match) => match[1]);
}

describe('the shell stacking condition', () => {
  test('CnEditorShell.svelte carries exactly one container-query literal', () => {
    expect(containerQueryValues(shellSource)).toHaveLength(1);
  });

  test("it equals content-golden's wide-composition literal", () => {
    const [shellCondition] = containerQueryValues(shellSource);

    // content-triad also declares an `@container` block; matching the one
    // that names `.content-golden` in its body keeps this test correct if
    // triad's threshold ever changes independently of golden's.
    const goldenBlock = [
      ...contentContainersCss.matchAll(
        /@container \(min-width: ([\d.]+)rem\) \{([\s\S]*?)\n\}/g,
      ),
    ].find((match) => match[2].includes('.content-golden {'));

    expect(goldenBlock).toBeDefined();
    expect(shellCondition).toBe(goldenBlock?.[1]);
  });
});
