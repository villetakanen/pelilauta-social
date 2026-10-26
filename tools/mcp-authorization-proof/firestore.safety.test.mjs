import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertFirestoreOptIn,
  parseFirestoreCredentials,
  validateFirestoreEnvironment,
} from './firestore-guards.mjs';
import { cleanupRunNamespace, recordRef } from './firestore-store.mjs';

const project = 'skaldbase-test';
const accountText = JSON.stringify({ project_id: project });
const uuid = '93bcc686-f67d-4f88-bda5-5a06d8e89de3';

test('Firestore execution requires an explicit true opt-in before credential loading', async () => {
  for (const value of [undefined, 'false', '1'])
    await assert.rejects(
      validateFirestoreEnvironment({ MCP_PROOF_FIRESTORE: value }),
      /MCP_PROOF_FIRESTORE=true/,
    );
});

test('the live proof refuses emulator redirection before credential loading', async () => {
  await assert.rejects(
    validateFirestoreEnvironment({
      MCP_PROOF_FIRESTORE: 'true',
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    }),
    /emulator target/,
  );
  assert.doesNotThrow(() =>
    assertFirestoreOptIn({ MCP_PROOF_FIRESTORE: 'true' }),
  );
});

test('both principal and app configuration must identify the test project', () => {
  for (const [principal, env] of [
    [
      JSON.stringify({ project_id: 'another-project' }),
      `PUBLIC_projectId=${project}`,
    ],
    [accountText, 'PUBLIC_projectId=another-project'],
    [accountText, ''],
  ])
    assert.throws(
      () => parseFirestoreCredentials(principal, env),
      /both repository project guards/,
    );
  assert.equal(
    parseFirestoreCredentials(
      accountText,
      `PUBLIC_projectId = "${project}" # test`,
    ).project_id,
    project,
  );
});

test('malformed principal errors contain no JSON credential snippet', () => {
  assert.throws(
    () => parseFirestoreCredentials('{"private_key":"synthetic-sentinel', ''),
    (error) =>
      error.message === 'Cannot parse the test service principal.' &&
      !error.message.includes('synthetic-sentinel'),
  );
});

test('record and cleanup helpers refuse other projects, collections and namespace shapes', async () => {
  for (const [projectId, collection, id] of [
    ['another-project', 'mcpAuthorizationProof214', uuid],
    [project, 'sites', uuid],
    [project, 'mcpAuthorizationProof214', 'existing-record'],
  ]) {
    const ref = { firestore: { projectId }, parent: { path: collection }, id };
    assert.throws(
      () => recordRef(ref, 'codes', 'synthetic-code'),
      /Invalid isolated/,
    );
    await assert.rejects(cleanupRunNamespace(ref), /Invalid isolated/);
  }
});

test('cleanup refuses a namespace without the proof marker', async () => {
  let deleted = false;
  const ref = {
    firestore: { projectId: project },
    parent: { path: 'mcpAuthorizationProof214' },
    id: uuid,
    get: async () => ({ exists: true, data: () => ({ purpose: 'unrelated' }) }),
    delete: async () => {
      deleted = true;
    },
  };
  await assert.rejects(cleanupRunNamespace(ref), /unrelated namespace/);
  assert.equal(deleted, false);
});
