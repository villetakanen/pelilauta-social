/**
 * Unit tests for the reading-anchor rule stated in
 * specs/pelilauta/threads/replies/spec.md: a live update that removes the
 * reply a reader is on anchors the viewport on the next surviving reply, or
 * on the preceding one when none follows, and on the discussion heading when
 * nothing survives.
 */

import { describe, expect, it } from 'vitest';
import { selectReadingAnchor } from '../../src/threads/readingAnchor';

const BEFORE = ['a', 'b', 'c', 'd'];

describe('selectReadingAnchor', () => {
  it('keeps a surviving reply as the anchor', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'b', 'c', 'd'], 'b')).toBe('b');
  });

  it('anchors on the next surviving reply when the visible one is removed', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'c', 'd'], 'b')).toBe('c');
  });

  it('skips removed replies to reach the next survivor', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'd'], 'b')).toBe('d');
  });

  it('anchors on the preceding reply when none follows', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'b'], 'd')).toBe('b');
  });

  it('anchors on the heading when the discussion empties', () => {
    expect(selectReadingAnchor(BEFORE, [], 'b')).toBeNull();
  });

  it('anchors on the heading when no reply is visible', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'b', 'c', 'd'], null)).toBeNull();
  });

  it('anchors on the heading for a key the previous order never carried', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'b'], 'z')).toBeNull();
  });

  it('anchors on a reply the update added after the removed one', () => {
    expect(selectReadingAnchor(BEFORE, ['a', 'c', 'd', 'e'], 'b')).toBe('c');
  });
});
