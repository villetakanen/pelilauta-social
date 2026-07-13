import { persistentAtom } from '@nanostores/persistent';
import type { Character } from '@schemas/CharacterSchema';

export const charactersInKeeper = persistentAtom<Character[]>(
  'charactersInKeeper',
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

// TODO: Add stale-while-revalidate logic
