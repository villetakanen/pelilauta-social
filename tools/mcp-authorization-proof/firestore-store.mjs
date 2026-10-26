import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { REQUIRED_PROJECT_ID } from './firestore-guards.mjs';
import { Store, stageNextState } from './proof.mjs';

export const MAX_RUN_RECORDS = 120;
const COLLECTION = 'mcpAuthorizationProof214';
const PURPOSE = 'oauth-authorization-proof-214';
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertRunRef(ref) {
  if (
    ref.firestore.projectId !== REQUIRED_PROJECT_ID ||
    ref.parent.path !== COLLECTION ||
    !UUID.test(ref.id)
  )
    throw new Error('Invalid isolated Firestore proof namespace.');
}

export function recordRef(runRef, kind, id) {
  assertRunRef(runRef);
  if (!['codes', 'tokens'].includes(kind) || typeof id !== 'string' || !id)
    throw new Error('Invalid proof record.');
  const hash = createHash('sha256').update(id).digest('hex');
  return runRef.collection(kind).doc(hash);
}

function hydrate(value) {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(hydrate);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, hydrate(item)]),
    );
  return value;
}

function serialize(value) {
  if (value === undefined) throw new Error('Undefined proof record field.');
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  return value;
}

export async function loadRunStore(db, runRef) {
  assertRunRef(runRef);
  if (db !== runRef.firestore) throw new Error('Mismatched proof database.');
  const [codes, tokens] = await Promise.all([
    runRef
      .collection('codes')
      .limit(MAX_RUN_RECORDS + 1)
      .get(),
    runRef
      .collection('tokens')
      .limit(MAX_RUN_RECORDS + 1)
      .get(),
  ]);
  if (codes.size + tokens.size > MAX_RUN_RECORDS)
    throw new Error(`Proof run exceeds ${MAX_RUN_RECORDS} record bound.`);
  const store = new Store();
  for (const doc of codes.docs) {
    const code = hydrate(doc.data());
    store.codes.set(code.code, code);
  }
  for (const doc of tokens.docs) {
    const token = hydrate(doc.data());
    store.tokens.set(token.accessToken, token);
    if (token.refreshToken)
      store.refresh.set(token.refreshToken, token.accessToken);
  }
  store.commit = async (work) => {
    await store.barrier?.();
    if (store.failCommit) throw new Error('injected commit failure');
    const next = stageNextState(store, work);
    if (next.codes.size + next.tokens.size > MAX_RUN_RECORDS)
      throw new Error('Proof run record bound exceeded.');
    await db.runTransaction(
      async (tx) => {
        const reads = [];
        for (const id of work.consumeCodes.keys())
          reads.push(recordRef(runRef, 'codes', id));
        for (const id of work.consumeRefresh.keys()) {
          const accessId = store.refresh.get(id);
          if (!accessId) throw new Error('refresh conflict');
          reads.push(recordRef(runRef, 'tokens', accessId));
        }
        const docs = reads.length ? await tx.getAll(...reads) : [];
        const live = new Store();
        let index = 0;
        for (const id of work.consumeCodes.keys()) {
          const snapshot = docs[index++];
          if (snapshot.exists) live.codes.set(id, hydrate(snapshot.data()));
        }
        for (const id of work.consumeRefresh.keys()) {
          const accessId = store.refresh.get(id);
          const snapshot = docs[index++];
          if (snapshot.exists) {
            const token = hydrate(snapshot.data());
            if (token.refreshToken !== id) throw new Error('refresh conflict');
            live.tokens.set(accessId, token);
            live.refresh.set(id, accessId);
          }
        }
        const committed = stageNextState(live, work);
        for (const id of work.consumeCodes.keys())
          tx.update(recordRef(runRef, 'codes', id), { revoked: true });
        for (const id of work.consumeRefresh.keys())
          tx.update(recordRef(runRef, 'tokens', store.refresh.get(id)), {
            revoked: true,
          });
        for (const id of work.writeCodes.keys())
          tx.create(
            recordRef(runRef, 'codes', id),
            serialize(committed.codes.get(id)),
          );
        for (const id of work.writeTokens.keys())
          tx.create(
            recordRef(runRef, 'tokens', id),
            serialize(committed.tokens.get(id)),
          );
        if (store.failStagedCommit)
          throw new Error('injected staged commit failure');
      },
      { maxAttempts: 3 },
    );
    store.codes = next.codes;
    store.tokens = next.tokens;
    store.refresh = next.refresh;
  };
  return store;
}

export async function createRunNamespace(db, namespace) {
  const ref = db.collection(COLLECTION).doc(namespace);
  assertRunRef(ref);
  await ref.create({ purpose: PURPOSE, createdAt: Timestamp.now() });
  return ref;
}

export async function cleanupRunNamespace(ref) {
  assertRunRef(ref);
  const run = await ref.get();
  if (!run.exists) return { codes: 0, tokens: 0 };
  if (run.data().purpose !== PURPOSE)
    throw new Error('Refusing to clean an unrelated namespace.');
  const removed = { codes: 0, tokens: 0 };
  for (const kind of ['codes', 'tokens']) {
    while (true) {
      const snapshot = await ref.collection(kind).limit(MAX_RUN_RECORDS).get();
      if (snapshot.empty) break;
      const batch = ref.firestore.batch();
      for (const doc of snapshot.docs) batch.delete(doc.ref);
      await batch.commit();
      removed[kind] += snapshot.size;
    }
  }
  await ref.delete();
  return removed;
}
