import { toDate } from 'src/utils/schemaHelpers';
import * as z from 'zod';

export const ACCOUNTS_COLLECTION_NAME = 'account';

export const AccountSchema = z.object({
  eulaAccepted: z.boolean(),
  lastLogin: z.date().optional(), // Timestamp, converted to Date
  lightMode: z.string().optional(), // dark or light
  uid: z.string(),
  updatedAt: z.date().optional(), // Timestamp, converted to Date
  showAdminTools: z.string().optional(), // true or false, admin tools check admin privileges,
  language: z.string().optional(),
  // and this is used only for the UX of the App
  frozen: z.boolean().optional(),
});

export type Account = z.infer<typeof AccountSchema>;

export function parseAccount(
  data: Record<string, unknown>,
  uid?: string,
): Account {
  if (!data) throw new Error('Can not parse account data from empty object');
  if (!data.uid && !uid)
    throw new Error(
      'Can not parse account data without uid in either data or as a parameter',
    );

  return AccountSchema.parse({
    ...data,
    lastLogin: data.lastLogin ? toDate(data.lastLogin) : new Date(),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    uid: uid || data.uid,
    showadminTools: data.showAdminTools ? data.showAdminTools : 'false',
    eulaAccepted: data.eulaAccepted ? !!data.eulaAccepted : false,
    language: data.language ? data.language : 'fi',
  });
}
