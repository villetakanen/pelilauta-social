import { doc, updateDoc } from 'firebase/firestore';
import { type Asset, parseAsset } from 'src/schemas/AssetSchema';
import { SITES_COLLECTION_NAME, type Site } from 'src/schemas/SiteSchema';
import { db } from '..';

export async function updateSiteAsset(site: Site, asset: Partial<Asset>) {
  if (!site.assets) {
    throw new Error('Site does not have any assets, can not update');
  }
  // we allow updates to
  // asset.description
  // asset.name
  // asset.license
  const assets = [...site.assets];
  const index = assets.findIndex((a) => a.storagePath === asset.storagePath);

  if (index === -1) {
    throw new Error('Asset does not exist in site');
  }

  const update = parseAsset(assets[index]);

  update.description = asset.description ?? update.description;
  update.name = asset.name ?? update.name;
  update.license = asset.license ?? update.license;

  assets[index] = update;

  await updateDoc(doc(db, SITES_COLLECTION_NAME, site.key), {
    assets: assets,
  });
}
