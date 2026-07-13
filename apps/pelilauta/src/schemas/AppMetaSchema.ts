import { z } from 'zod';

export const AppMetaSchema = z.object({
  admins: z.array(z.string()).default([]),
});

export type AppMeta = z.infer<typeof AppMetaSchema>;
