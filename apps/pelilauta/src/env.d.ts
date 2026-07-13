/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  // Netlify cache purging configuration
  readonly NETLIFY_SITE_ID: string;
  readonly NETLIFY_PURGE_TOKEN: string;

  // Add other environment variables as needed
  // readonly PUBLIC_EXAMPLE_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
