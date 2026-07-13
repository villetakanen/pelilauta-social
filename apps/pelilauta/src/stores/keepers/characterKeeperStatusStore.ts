import { map } from 'nanostores';

export type CharacterKeeperStatus = {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

export const characterKeeperStatus = map<CharacterKeeperStatus>({
  loading: true,
  error: null,
  lastUpdated: null,
});
