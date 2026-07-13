import { topicSchema } from 'src/schemas/MetaTopicsSchema';
import { expect, test } from 'vitest';

test('topics require a name, noun (an icon name) and a slug to be valid', () => {
  const topic = {
    name: 'Test topic',
    icon: 'Test icon',
    slug: 'test-topic',
  };
  const parsed = topicSchema.parse(topic);
  expect(parsed.name).toBe('Test topic');
  expect(parsed.icon).toBe('Test icon');
  expect(parsed.slug).toBe('test-topic');
});
