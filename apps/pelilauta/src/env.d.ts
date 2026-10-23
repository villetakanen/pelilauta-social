/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    resolveSession: () => Promise<
      import('./utils/server/auth/verifySession').SessionVerification
    >;
    authenticationDependent?: boolean;
    protectedDocument?: boolean;
    protectedRecovery?: {
      status: 401 | 500 | 503;
      destination: string;
    };
  }
}

interface ImportMetaEnv {
  readonly NETLIFY_SITE_ID: string;
  readonly NETLIFY_PURGE_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
