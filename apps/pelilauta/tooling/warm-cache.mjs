const BASE_URL = process.env.DEPLOY_PRIME_URL || process.env.URL;

if (!BASE_URL) {
  console.error('No DEPLOY_PRIME_URL or URL environment variable found. Skipping cache warming.');
  process.exit(0); // Exit gracefully
}

const endpoints = [
  '/',
  '/api/threads.json',
  '/api/meta/channels.json',
  '/api/sites',
];

async function warmCache() {
  console.log(`Warming cache for ${BASE_URL}`);
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      console.log(`Successfully warmed cache for ${url}`);
    } catch (error) {
      console.error(error.message);
      // Don't fail the build if cache warming fails
    }
  }
}

warmCache();
