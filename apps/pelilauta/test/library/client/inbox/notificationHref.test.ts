import { describe, expect, it } from 'vitest';
import { notificationHref } from '../../../../src/library/client/inbox/notificationHref';

const href = (targetType: string, targetKey: string) =>
  notificationHref({ targetType, targetKey } as never);

describe('notificationHref', () => {
  it('links a reply notification to the reply', () => {
    expect(href('thread.reply', 'thr/rep')).toBe('/threads/thr#rep');
  });
  it('links a bare-thread reply notification to the discussion', () => {
    expect(href('thread.reply', 'thr')).toBe('/threads/thr#discussion');
  });
  it('keeps the other destinations', () => {
    expect(href('thread.loved', 'thr')).toBe('/threads/thr');
    expect(href('site.loved', 's')).toBe('/sites/s');
    expect(href('site.invited', 's')).toBe('/sites/s');
    expect(href('handout.update', 's/h')).toBe('/sites/s/handouts/h');
    expect(href('reply.loved', 'thr/rep')).toBeUndefined();
  });
});
