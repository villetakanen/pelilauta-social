import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import type { Store } from './oauth.mjs';
export const PURPOSE: string;
export function loadRunStore(
  db: Firestore,
  runRef: DocumentReference,
): Promise<Store>;
export function createRunNamespace(
  db: Firestore,
  namespace: string,
): Promise<DocumentReference>;
export function cleanupRunNamespace(
  ref: DocumentReference,
): Promise<{ codes: number; tokens: number }>;
