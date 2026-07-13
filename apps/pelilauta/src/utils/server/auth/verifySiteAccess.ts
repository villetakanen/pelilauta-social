import { getSiteData } from '@firebase/server/sites';
import type { Site } from '@schemas/SiteSchema';

interface SiteAccess {
  isMember: boolean;
  isOwner: boolean;
  isPlayer: boolean;
}

export async function verifySiteAccess(
  siteOrSiteKey: Site | string,
  uid: string,
): Promise<SiteAccess> {
  let site: Site | null = null;
  if (typeof siteOrSiteKey === 'string') {
    site = await getSiteData(siteOrSiteKey);
  } else {
    site = siteOrSiteKey;
  }

  if (!site) {
    return { isMember: false, isOwner: false, isPlayer: false };
  }

  const isOwner = site.owners.includes(uid);
  const isPlayer = site.players?.includes(uid) || false;
  const isMember = isOwner || isPlayer;

  return { isMember, isOwner, isPlayer };
}
