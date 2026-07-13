import { expect, test } from 'vitest';
import { createThread, ThreadSchema } from '../../src/schemas/ThreadSchema';

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
