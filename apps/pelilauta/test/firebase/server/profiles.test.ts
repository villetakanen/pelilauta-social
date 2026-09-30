/**
 * Unit tests for the server profile reader.
 *
 * `firebase/server/profiles.ts` is the single Firestore access point for
 * profile reads, shared by the REST route and server-rendered pages. These
 * tests mock `serverDB` so they never touch a real Firestore instance.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockDoc = vi.fn(() => ({ get: mockGet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockGetAll = vi.fn();

vi.mock('../../../src/firebase/server/index.js', () => ({
  serverDB: {
    collection: mockCollection,
    getAll: mockGetAll,
  },
}));

import {
  getProfileData,
  getPublicProfiles,
} from '../../../src/firebase/server/profiles';

describe('getProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the parsed profile when the document exists', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ nick: 'Ville', username: 'ville' }),
    });

    const profile = await getProfileData('uid-1');

    expect(mockCollection).toHaveBeenCalledWith('profiles');
    expect(mockDoc).toHaveBeenCalledWith('uid-1');
    expect(profile).toEqual(
      expect.objectContaining({
        key: 'uid-1',
        nick: 'Ville',
        username: 'ville',
      }),
    );
  });

  it('returns null when the document does not exist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

    const profile = await getProfileData('missing-uid');

    expect(profile).toBeNull();
  });

  it('returns null instead of throwing when the read fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'));

    const profile = await getProfileData('uid-err');

    expect(profile).toBeNull();
  });
});

describe('getPublicProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty map without touching Firestore for empty input', async () => {
    const result = await getPublicProfiles([]);

    expect(result).toEqual({});
    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockGetAll).not.toHaveBeenCalled();
  });

  it('resolves a single uid to its public attribution', async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        id: 'uid-a',
        exists: true,
        data: () => ({ nick: 'Aino', username: 'aino' }),
      },
    ]);

    const result = await getPublicProfiles(['uid-a']);

    expect(result).toEqual({
      'uid-a': { key: 'uid-a', nick: 'Aino', username: 'aino' },
    });
  });

  it('omits a uid whose document is missing, in a mixed batch', async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        id: 'uid-a',
        exists: true,
        data: () => ({ nick: 'Aino', username: 'aino' }),
      },
      { id: 'uid-b', exists: false, data: () => undefined },
    ]);

    const result = await getPublicProfiles(['uid-a', 'uid-b']);

    expect(Object.keys(result)).toEqual(['uid-a']);
  });

  it('omits a document that fails the public schema, rather than throwing', async () => {
    mockGetAll.mockResolvedValueOnce([
      { id: 'uid-c', exists: true, data: () => ({}) }, // no nick, so no valid username either
    ]);

    const result = await getPublicProfiles(['uid-c']);

    expect(result).toEqual({});
  });

  it('dedupes repeated uids before reading Firestore', async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        id: 'uid-a',
        exists: true,
        data: () => ({ nick: 'Aino', username: 'aino' }),
      },
    ]);

    await getPublicProfiles(['uid-a', 'uid-a']);

    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('returns an empty map instead of throwing when the batch read fails', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('boom'));

    const result = await getPublicProfiles(['uid-a']);

    expect(result).toEqual({});
  });
});
