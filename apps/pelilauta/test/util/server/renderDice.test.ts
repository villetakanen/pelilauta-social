import { expect, test } from 'vitest';
import { renderDice } from '../../../src/utils/server/renderDice';

test('dice are converted to elements', () => {
  const content = 'This is a line with dice:20';
  const expected = 'This is a line with <cn-dice sides="20"></cn-dice>';
  expect(renderDice(content)).toBe(expected);
});

test('dice are converted to elements, with set value', () => {
  const content = 'This is a line with dice:20:5 (value is 5)';
  const expected =
    'This is a line with <cn-dice sides="20" value="5"></cn-dice> (value is 5)';
  expect(renderDice(content)).toBe(expected);
});

test('A html element can end in a dice roll', () => {
  const content = '<p>This is a line with dice:20</p>';
  const expected = '<p>This is a line with <cn-dice sides="20"></cn-dice></p>';
  expect(renderDice(content)).toBe(expected);
});
