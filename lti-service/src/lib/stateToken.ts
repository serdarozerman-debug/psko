/**
 * Cookieless-mode state token (FR-9 / AC-13).
 *
 * ltijs only carries OIDC state in a cookie; modern browsers (Safari 17+,
 * Chrome with Privacy Sandbox) block 3rd-party cookies inside an LMS iframe,
 * which breaks launch.
 *
 * Our workaround:
 *  - On /lti/login we generate a UUID `state`, store
 *      {state, nonce, platformId, targetLinkUri, expiresAt}
 *    in Supabase, and pass `state` only as a query param.
 *  - On /lti/launch we look up by `state` and delete the row (single-use).
 *
 * This module is store-agnostic: a `StateStore` interface lets us swap the
 * Supabase-backed implementation for an in-memory one in tests.
 */
import { randomUUID } from 'crypto';

export interface StateRecord {
  state: string;
  nonce: string;
  platformId: string;
  targetLinkUri: string;
  expiresAt: Date;
}

export interface StateStore {
  insert(record: StateRecord): Promise<void>;
  /** Atomically read + delete (single-use). Returns null if not found. */
  take(state: string): Promise<StateRecord | null>;
}

export interface CreateStateInput {
  platformId: string;
  nonce: string;
  targetLinkUri: string;
  ttlMs: number;
}

export async function createState(
  store: StateStore,
  input: CreateStateInput,
): Promise<{ state: string; expiresAt: Date }> {
  const state = randomUUID();
  const expiresAt = new Date(Date.now() + input.ttlMs);
  await store.insert({
    state,
    nonce: input.nonce,
    platformId: input.platformId,
    targetLinkUri: input.targetLinkUri,
    expiresAt,
  });
  return { state, expiresAt };
}

/**
 * Consume (single-use): returns the row if found AND not expired, else null.
 * The row is always deleted on lookup, whether expired or not.
 */
export async function consumeState(
  store: StateStore,
  state: string,
): Promise<StateRecord | null> {
  const record = await store.take(state);
  if (!record) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record;
}
