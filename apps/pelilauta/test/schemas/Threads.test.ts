import { expect, test } from 'vitest';
import {
  createThread,
  parseThread,
  ThreadSchema,
} from '../../src/schemas/ThreadSchema';

test('createThread factory creates a thread object', () => {
  const thread = createThread(
    {
      title: 'title',
      owners: ['owner 1'],
      channel: 'channel',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    'key',
  );
  const parsed = ThreadSchema.parse(thread);
  expect(parsed).toEqual(thread);
});

test('createThread factory creates a thread object with public set to true', () => {
  const thread = createThread();
  expect(thread.public).toBe(true);
  expect(thread.owners).toEqual(['-']); // Should have default owner
});

test('ThreadSchema requires at least one owner', () => {
  expect(() => {
    ThreadSchema.parse({
      title: 'Test Thread',
      channel: 'general',
      owners: [], // Empty owners array should fail
    });
  }).toThrow();
});

test('ThreadSchema accepts thread with valid owner', () => {
  const validThread = {
    title: 'Test Thread',
    channel: 'general',
    owners: ['user123'],
  };

  expect(() => {
    ThreadSchema.parse(validThread);
  }).not.toThrow();
});

// There are multiple ways the app has persisted the thread data during
// the history of this app. Either by having only a poster, or only images[]

const withImages = (images: unknown, poster?: string) =>
  parseThread({
    title: 'Test Thread',
    channel: 'general',
    owners: ['user123'],
    images,
    ...(poster ? { poster } : {}),
  });

test('parseThread derives an absent poster from the first image', () => {
  const thread = withImages([
    { url: 'https://example.com/first.webp', alt: 'first' },
    { url: 'https://example.com/second.webp', alt: 'second' },
  ]);
  expect(thread.poster).toBe('https://example.com/first.webp');
});

test('parseThread keeps a poster the author selected', () => {
  const thread = withImages(
    [{ url: 'https://example.com/first.webp', alt: 'first' }],
    'https://example.com/chosen.webp',
  );
  expect(thread.poster).toBe('https://example.com/chosen.webp');
});

test('parseThread derives a poster from a legacy string image array', () => {
  const thread = withImages(['https://example.com/legacy.webp']);
  expect(thread.poster).toBe('https://example.com/legacy.webp');
});

test('parseThread leaves a thread with no pictures without a poster', () => {
  expect(withImages(undefined).poster).toBeUndefined();
  expect(withImages([]).poster).toBeUndefined();
});

test('parseThread derives the gallery from a poster-only thread', () => {
  const thread = parseThread({
    title: 'Haukka & Meri',
    channel: 'general',
    owners: ['user123'],
    poster: 'https://example.com/only.webp',
  });
  expect(thread.images).toEqual([
    { url: 'https://example.com/only.webp', alt: 'Haukka & Meri' },
  ]);
  expect(thread.poster).toBe('https://example.com/only.webp');
});

test('parseThread does not add a poster to an existing gallery', () => {
  const thread = withImages(
    [{ url: 'https://example.com/first.webp', alt: 'first' }],
    'https://example.com/chosen.webp',
  );
  expect(thread.images).toEqual([
    { url: 'https://example.com/first.webp', alt: 'first' },
  ]);
});
