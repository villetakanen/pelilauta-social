/**
 * The link guarantee a browser cannot be asked about.
 *
 * Everything else the default link presentation promises is asserted against a
 * rendered page in apps/design/e2e/links.spec.ts. `:visited` is not observable
 * there: it is reported to getComputedStyle as the unvisited style, by every
 * browser, on purpose. That privacy behaviour is what hides a rule that would
 * disclose history, so the rule has to be read from the source instead.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const STYLES = fileURLToPath(new URL('../styles', import.meta.url));

/** Source with comments removed, so prose about a utility never counts as one. */
function withoutComments(source: string) {
  return readFileSync(join(STYLES, source), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

/**
 * A selector list split on its own commas. `:not(.button, .fab)` carries one of
 * its own, so depth is tracked rather than the string being split naively.
 */
function compounds(selector: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of selector) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      found.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  found.push(current.trim());
  return found;
}

describe('link presentation', () => {
  test('the visited rule is the resting rule, so history is never disclosed', () => {
    const links = withoutComments('links.css');
    const rules = [...links.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
      selector: match[1].replace(/\s+/g, ' ').trim(),
      body: match[2],
    }));

    const visited = rules.filter((rule) => rule.selector.includes(':visited'));
    expect(visited).toHaveLength(1);

    // Sharing a selector list is what makes the two states one declaration: a
    // visited link cannot drift from a resting one by editing only its own rule.
    const states = compounds(visited[0].selector);
    expect(states.some((one) => !one.includes(':visited'))).toBe(true);
    expect(new Set(states.map((one) => one.replace(':visited', ''))).size).toBe(
      1,
    );
  });
});
