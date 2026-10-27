import assert from 'node:assert/strict';
import handler from '../../.netlify/v1/functions/ssr/ssr.mjs';

const context = { ip: '127.0.0.1' };
const request = (path) => new Request(`http://localhost:4321${path}`);
const config = await handler(request('/api/test/firebase-config'), context);
assert.equal((await config.json()).projectId, 'skaldbase-test');

const originalFetch = globalThis.fetch;
const originalContext = globalThis.netlifyBlobsContext;
const items = [
  {
    title: 'Cached RSS runtime fixture',
    link: 'https://fixture.invalid/article',
  },
];
let reads = 0;

try {
  globalThis.netlifyBlobsContext = Buffer.from(
    JSON.stringify({
      siteID: 'proof-site',
      token: 'synthetic-proof-token',
      edgeURL: 'https://blobs-proof.invalid',
      uncachedEdgeURL: 'https://blobs-proof.invalid',
    }),
  ).toString('base64');
  globalThis.fetch = async (input, init) => {
    const backendRequest = new Request(input, init);
    assert.equal(
      new URL(backendRequest.url).origin,
      'https://blobs-proof.invalid',
    );
    assert.equal(backendRequest.method, 'GET');
    reads++;
    return Response.json({ timestamp: Date.now(), data: items });
  };

  const response = await handler(
    request('/api/external/rss/myrrys.json'),
    context,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Cache-Status'), 'HIT');
  assert.deepEqual(await response.json(), items);
  assert.equal(reads, 1);
  console.log(
    'Netlify adapter: packaged RSS endpoint reads its synthetic Blobs cache.',
  );
} finally {
  globalThis.fetch = originalFetch;
  if (originalContext === undefined) delete globalThis.netlifyBlobsContext;
  else globalThis.netlifyBlobsContext = originalContext;
}
