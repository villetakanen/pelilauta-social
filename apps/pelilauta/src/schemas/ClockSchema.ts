/**
 * A PbtA -style drama/storytelling clock.
 *
 * An example of a Clock entry is as follows:
 * {
 *  key: "clock-1",
 *  ticks: [1, 1, 1, 3, 3, 3]}, // The visual size of each tick
 *  label: "The Big Bad's Plan", // The name of the clock
 *  stage: 0, // The current stage of the clock
 *   ...ContentEntry
 * }
 */

import { z } from 'zod';
import { ContentEntrySchema } from './ContentEntry';

export const CLOCKS_COLLECTION_NAME = 'clocks';

export const ClockSchema = ContentEntrySchema.extend({
  ticks: z.array(z.number()),
  label: z.string(),
  stage: z.number(),
});

export type Clock = z.infer<typeof ClockSchema>;

export function parseClock(data: Partial<Clock>, key?: string): Clock {
  return ClockSchema.parse({
    ...data,
    owners: data.owners ?? [],
    flowTime: data.flowTime ?? 0,
    key: key ?? data.key ?? '',
    ticks: data.ticks ?? [],
    label: data.label || '',
    stage: data.stage ?? 0,
  });
}
