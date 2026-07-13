import type { Asset } from 'src/schemas/AssetSchema';

export interface EntryWithImages {
  images: Asset[] | string[] | string | null | undefined;
}

export function fixImageData(
  entry: Record<string, unknown>,
): Record<string, unknown> {
  // Check if the entry has an images property
  if (!entry.images) {
    return entry;
  }

  const entryWithImages: EntryWithImages = {
    ...entry,
    images: entry.images,
  } as EntryWithImages;

  // If images is a string, convert it to an array
  if (typeof entryWithImages.images === 'string') {
    entryWithImages.images = [entryWithImages.images];
  }

  // If images is an array of strings, convert it to an array of Asset objects
  if (
    Array.isArray(entryWithImages.images) &&
    entryWithImages.images.every((img) => typeof img === 'string')
  ) {
    entryWithImages.images = entryWithImages.images.map((img) => ({
      url: img,
      type: 'image', // Assuming the type is always "image" for simplicity
      description: '',
      license: '',
      name: '',
      alt: '',
    })) as Asset[];
  }

  // If images is an array of Asset objects, ensure they are valid
  return { ...entryWithImages } as Record<string, unknown>;
}
