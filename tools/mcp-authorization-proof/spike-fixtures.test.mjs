import assert from 'node:assert/strict';
import test from 'node:test';
import { fixturePlan, prepareFixtures, SITE_KEYS } from './spike-fixtures.mjs';

const namespace = '0d2df263-659b-4d53-988a-0c9218a4055b';
test('fixture preparation refuses missing opt-in and Auth emulator redirection', async () => {
  await assert.rejects(prepareFixtures({}), /Explicit non-emulated/);
  await assert.rejects(
    prepareFixtures({
      MCP_SPIKE_PREPARE: 'true',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    }),
    /Explicit non-emulated/,
  );
});
test('fixture plan contains only one namespace and the two fixed site/page pairs', () => {
  const plan = fixturePlan(namespace, ['user-a', 'user-b'], 1000);
  assert.deepEqual(
    plan.map((item) => item.path),
    [
      `mcpAuthorizationProof214/${namespace}`,
      'sites/mcp-proof-214-a',
      'sites/mcp-proof-214-a/pages/proof',
      'sites/mcp-proof-214-b',
      'sites/mcp-proof-214-b/pages/proof',
    ],
  );
  for (const key of SITE_KEYS) {
    const site = plan.find((item) => item.path === `sites/${key}`).data;
    const page = plan.find(
      (item) => item.path === `sites/${key}/pages/proof`,
    ).data;
    assert.equal(site.hidden, true);
    assert.deepEqual(site.owners, ['user-a']);
    assert.deepEqual(site.players, ['user-b']);
    assert.equal(site.mcpProofNamespace, namespace);
    assert.equal(page.mcpProofNamespace, namespace);
    assert.equal(page.siteKey, key);
    assert.match(page.markdownContent, /Hyvää päivää. Välkommen./);
  }
});
test('fixture plan rejects arbitrary namespaces and missing or duplicated accounts', () => {
  for (const value of [
    '',
    'production',
    '../other',
    '0d2df263-659b-1d53-988a-0c9218a4055b',
  ])
    assert.throws(() => fixturePlan(value, ['a', 'b']));
  for (const users of [[], ['a'], ['a', 'a'], ['', 'b'], ['a', 'b', 'c']])
    assert.throws(() => fixturePlan(namespace, users));
});
