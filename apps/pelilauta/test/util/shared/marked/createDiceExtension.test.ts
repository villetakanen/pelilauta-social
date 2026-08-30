import { Marked } from 'marked';
import { expect, test } from 'vitest';
import { createDiceExtension } from '../../../../src/utils/shared/marked/createDiceExtension';

function render(markdown: string): string {
  const marked = new Marked({ gfm: true, breaks: true, pedantic: false });
  marked.use(createDiceExtension());
  return marked.parse(markdown) as string;
}

// Scenarios from specs/pelilauta/wiki-dice-notation/spec.md

test('dice:20 renders a die span', () => {
  const result = render('prose containing dice:20');
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="20" data-value="20" data-kind="die" data-length="2" aria-label="[20]">20</span>',
  );
});

test('dice:6:2 renders a result span', () => {
  const result = render('prose containing dice:6:2');
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>',
  );
});

test('target:6 and target:6+ emit the same target span', () => {
  const base = render('prose containing target:6');
  const plus = render('prose containing target:6+');
  const span =
    '<span class="dice" role="img" data-sides="6" data-value="6" data-kind="target" data-length="1" aria-label="[d6, 6+]">6<span class="dice-plus">+</span></span>';
  expect(base).toContain(span);
  expect(plus).toContain(span);
});

test('target:6:2 and target:6:2+ emit the same target span', () => {
  const bare = render('prose containing target:6:2');
  const plus = render('prose containing target:6:2+');
  const span =
    '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="target" data-length="1" aria-label="[d6, 2+]">2<span class="dice-plus">+</span></span>';
  expect(bare).toContain(span);
  expect(plus).toContain(span);
});

// Ruling: `[d<sides>, <sides>+]` is symmetric with the explicit-value form.
// The spec's Constraints section writes `[d<sides>, <sides>]+` in one place
// and `[d<sides>, <value>+]` in the other; this treats the first as a
// transcription slip. If the operator rules otherwise, only this assertion
// (and the one above for the bare `target:<sides>` form) need to change.
test('ruling: target:<sides> without a value carries a `+`-suffixed accessible name', () => {
  const result = render('prose containing target:6');
  expect(result).toContain('aria-label="[d6, 6+]"');
});

// Standard, shortcut and Obsidian wikilink text is exercised end to end,
// including the destination, in test/util/getMarked.test.ts — the wikilink
// extension there needs a site and origin this extension does not.
test('standard link text converts dice notation and keeps its href', () => {
  const result = render('[dice:6:2](some-page)');
  expect(result).toContain(
    '<a href="some-page">' +
      '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>' +
      '</a>',
  );
});

test('inline code leaves the notation as text', () => {
  const result = render('`dice:6:2`');
  expect(result).toContain('<code>dice:6:2</code>');
  expect(result).not.toContain('class="dice"');
});

test('a fenced code block leaves the notation as text', () => {
  const result = render('```\ndice:6:2\n```');
  expect(result).toContain('dice:6:2');
  expect(result).not.toContain('class="dice"');
});

test('a raw HTML element child leaves the notation as text', () => {
  const result = render('prose with <em>dice:6:2</em> inline');
  expect(result).toContain('<em>dice:6:2</em>');
  expect(result).not.toContain('class="dice"');
});

test('a raw HTML attribute value stays exactly as written', () => {
  const result = render('<div data-x="dice:6:2">text</div>');
  expect(result).toContain('data-x="dice:6:2"');
  expect(result).not.toContain('class="dice"');
});

test('a void element such as <br> does not open a literal region: notation after it still converts', () => {
  const result = render('prose<br>dice:6');
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="6" data-value="6" data-kind="die" data-length="1" aria-label="[6]">6</span>',
  );
});

test('a non-void element such as <em> still opens a literal region', () => {
  const result = render('<em>dice:6</em>');
  expect(result).not.toContain('class="dice"');
});

test('dice and target faces render before their punctuation', () => {
  const result = render(
    'Roll (yes it is a dice:6). And the dice result is target:6:2.',
  );
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="6" data-value="6" data-kind="die" data-length="1" aria-label="[6]">6</span>).',
  );
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="target" data-length="1" aria-label="[d6, 2+]">2<span class="dice-plus">+</span></span>.',
  );
});

test('an unsupported value stays text', () => {
  const result = render('prose containing dice:6:7');
  expect(result).toContain('dice:6:7');
  expect(result).not.toContain('class="dice"');
});

test('a leading zero stays text', () => {
  const result = render('prose containing dice:06');
  expect(result).toContain('dice:06');
  expect(result).not.toContain('class="dice"');
});

// Ruling: token boundary. Neither the character immediately before nor
// immediately after the notation may be a Unicode letter, a decimal digit,
// an underscore, a colon or a plus sign.

test('a fourth colon-separated segment denies the boundary and stays text in full', () => {
  const result = render('prose containing dice:6:2:3');
  expect(result).toContain('dice:6:2:3');
  expect(result).not.toContain('class="dice"');
});

test('a trailing digit after target:<sides>+ denies the boundary and stays text in full', () => {
  const result = render('prose containing target:6+5');
  expect(result).toContain('target:6+5');
  expect(result).not.toContain('class="dice"');
});

test('a leading letter denies the boundary and stays text in full', () => {
  const result = render('prose containing xdice:6');
  expect(result).toContain('xdice:6');
  expect(result).not.toContain('class="dice"');
});

test('a trailing letter denies the boundary and stays text in full', () => {
  const result = render('prose containing dice:6x');
  expect(result).toContain('dice:6x');
  expect(result).not.toContain('class="dice"');
});

test('data-length matches the value character count for one and two digit values', () => {
  const oneDigit = render('prose containing dice:6:2');
  expect(oneDigit).toContain(
    'data-value="2" data-kind="result" data-length="1"',
  );

  const twoDigit = render('prose containing dice:20');
  expect(twoDigit).toContain('data-value="20" data-kind="die" data-length="2"');
});

test('a target carries its `+` inside .dice-plus; die and result carry no inner element', () => {
  const target = render('prose containing target:20');
  expect(target).toContain(
    '<span class="dice" role="img" data-sides="20" data-value="20" data-kind="target" data-length="2" aria-label="[d20, 20+]">20<span class="dice-plus">+</span></span>',
  );

  const die = render('prose containing dice:20');
  expect(die).toContain(
    '<span class="dice" role="img" data-sides="20" data-value="20" data-kind="die" data-length="2" aria-label="[20]">20</span>',
  );
  expect(die).not.toContain('dice-plus');

  const result = render('prose containing dice:6:2');
  expect(result).toContain(
    '<span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>',
  );
  expect(result).not.toContain('dice-plus');
});

// Regression Guardrails

test('the server response contains the Dice span before client-side JavaScript runs', () => {
  // marked.parse runs synchronously on the server; the returned string
  // already carries the span with no client-side step involved.
  const result = render('prose containing dice:20');
  expect(typeof result).toBe('string');
  expect(result).toContain('class="dice"');
});

test('a literal context never gains a Dice span', () => {
  const result = render(
    [
      '`dice:6:2` and <em>dice:6:2</em>',
      '',
      '```',
      'dice:6:2',
      '```',
      '',
      '<div data-x="dice:6:2">text</div>',
    ].join('\n'),
  );
  expect(result).not.toContain('class="dice"');
});
