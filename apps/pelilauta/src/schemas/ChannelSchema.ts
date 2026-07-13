import { z } from 'zod';

export const CHANNELS_META_REF = 'meta/threads';

export const CHANNEL_NOUNS = ['discussion', 'adventurer'];
export const CHANNEL_DEFAULT_SLUG = 'yleinen';

export const EntryMetadataSchema = z.object({
  key: z.string().default(''),
  createTime: z.number().default(0),
  author: z.string().default('-'),
});

export const ChannelSchema = z.object({
  description: z.string(),
  icon: z.string().default('discussion'),
  name: z.string(),
  slug: z.string(),
  threadCount: z.number().default(0),
  category: z.string().optional(),
  flowTime: z.number().optional(),

  // Latest thread metadata
  latestThread: EntryMetadataSchema.optional(),
  // Latest post metadata
  latestReply: EntryMetadataSchema.optional(),
});

export const ChannelsSchema = z.array(ChannelSchema);

// Channel with additional statistics about latest threads
export const ChannelWithStatsSchema = ChannelSchema.extend({
  stats: z.object({
    latestThread: z.nullable(z.any()), // Using any for Thread to avoid circular dependency
    latestUpdatedThread: z.nullable(z.any()), // Same as above
  }),
});

export const ChannelsWithStatsSchema = z.array(ChannelWithStatsSchema);

export type Channel = z.infer<typeof ChannelSchema>;
export type Channels = z.infer<typeof ChannelsSchema>;
export type ChannelWithStats = z.infer<typeof ChannelWithStatsSchema>;

export function parseChannel(c: Partial<Channel>) {
  return ChannelSchema.parse({
    ...c,
    description: c.description || '',
    icon: c.icon || 'discussion',
    category: c.category || 'Pelilauta',
    flowTime: c.flowTime || 0,
  });
}
