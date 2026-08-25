/*
 * Contract tests for the application page frame.
 *
 * These cover the guardrails a stylesheet can be read for. The behavioural
 * scenarios need a rendered page and live in apps/design/e2e.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Source with comments removed, so a commented example never counts as a rule. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '');

const css = withoutComments(read('../styles/app-main.css'));

describe('scoping', () => {
  test('every rule sits below the frame class', () => {
    // A rule that escapes it reaches every page of both applications, including the
    // routes whose shells place themselves and never opt in.
    const optIn = '.app-main';
    // An at-rule prelude becomes a closing brace, so the selectors nested inside
    // it are scanned too rather than silently skipped.
    const flattened = css.replace(/@[\w-]+[^{};]*\{/g, '}');
    const rules = [...flattened.matchAll(/(^|[};])\s*([^{}@]+?)\s*\{/g)].map(
      (m) => m[2].replace(/\s+/g, ' ').trim(),
    );

    expect(rules.length).toBeGreaterThan(0);
    for (const selector of rules) {
      expect(selector.includes(optIn), `${selector} escapes ${optIn}`).toBe(
        true,
      );
    }
  });
});
