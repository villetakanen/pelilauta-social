import { expect, test } from 'vitest';
import { parseReply, ReplySchema } from '../../src/schemas/ReplySchema';

test('ReplySchema requires at least one owner', () => {
  expect(() => {
    ReplySchema.parse({
      threadKey: 'thread123',
      markdownContent: 'Test reply content',
      owners: [], // Empty owners array should fail
    });
  }).toThrow('Reply must have at least one owner');
});

test('ReplySchema accepts reply with valid owner', () => {
  const validReply = {
    threadKey: 'thread123',
    markdownContent: 'Test reply content',
    owners: ['user123'],
  };

  expect(() => {
    ReplySchema.parse(validReply);
  }).not.toThrow();
});

test('parseReply function works with valid data', () => {
  const replyData = {
    markdownContent: 'Test reply content',
    owners: ['user123'],
  };

  const reply = parseReply(replyData, 'reply123', 'thread123');

  expect(reply.key).toBe('reply123');
  expect(reply.threadKey).toBe('thread123');
  expect(reply.markdownContent).toBe('Test reply content');
  expect(reply.owners).toEqual(['user123']);
});

test('parseReply throws error when owners array is empty', () => {
  const replyData = {
    markdownContent: 'Test reply content',
    owners: [],
  };

  expect(() => {
    parseReply(replyData, 'reply123', 'thread123');
  }).toThrow();
});
