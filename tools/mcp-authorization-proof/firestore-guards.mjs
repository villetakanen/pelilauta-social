import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REQUIRED_PROJECT_ID = 'skaldbase-test';

export function assertFirestoreOptIn(env) {
  if (env.MCP_PROOF_FIRESTORE !== 'true')
    throw new Error(
      'Set MCP_PROOF_FIRESTORE=true to opt into the Firestore proof.',
    );
  if (env.FIRESTORE_EMULATOR_HOST)
    throw new Error('The live Firestore proof refuses an emulator target.');
}

export function parseFirestoreCredentials(accountText, appEnv) {
  let account;
  try {
    account = JSON.parse(accountText);
  } catch {
    throw new Error('Cannot parse the test service principal.');
  }
  if (
    account?.project_id !== REQUIRED_PROJECT_ID ||
    parse(appEnv).PUBLIC_projectId !== REQUIRED_PROJECT_ID
  )
    throw new Error(
      'Firestore proof requires both repository project guards to target skaldbase-test.',
    );
  return account;
}

export async function validateFirestoreEnvironment(env = process.env) {
  assertFirestoreOptIn(env);
  const [accountText, appEnv] = await Promise.all([
    readFile(resolve(root, 'server_principal.json'), 'utf8'),
    readFile(resolve(root, 'apps/pelilauta/.env'), 'utf8'),
  ]);
  return parseFirestoreCredentials(accountText, appEnv);
}
