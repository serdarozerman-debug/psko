/**
 * State-token tests (FR-9, AC-13).
 *
 * The state-token module is the cookieless-mode workaround for ltijs:
 *   - createState() generates a UUID-v4 state and stores
 *     {state, nonce, platformId, targetLinkUri, expiresAt} via the injected store.
 *   - consumeState() looks up + DELETES the row (single-use) and rejects when:
 *       - row not found
 *       - expiresAt < now
 *
 * We inject an in-memory store so the unit test does not need Supabase.
 */
import {
  createState,
  consumeState,
  type StateStore,
  type StateRecord,
} from '../lib/stateToken';

function memoryStore(): StateStore & { rows: Map<string, StateRecord> } {
  const rows = new Map<string, StateRecord>();
  return {
    rows,
    async insert(record: StateRecord) {
      rows.set(record.state, record);
    },
    async take(state: string) {
      const r = rows.get(state);
      if (!r) return null;
      rows.delete(state); // single-use
      return r;
    },
  };
}

describe('stateToken', () => {
  it('createState returns a UUID v4 string and persists the row', async () => {
    const store = memoryStore();
    const out = await createState(store, {
      platformId: 'platform-1',
      nonce: 'nonce-1',
      targetLinkUri: 'https://example.test/launch',
      ttlMs: 10 * 60_000,
    });
    expect(out.state).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(store.rows.get(out.state)).toBeDefined();
    expect(store.rows.get(out.state)?.platformId).toBe('platform-1');
    expect(store.rows.get(out.state)?.nonce).toBe('nonce-1');
    expect(store.rows.get(out.state)?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('consumeState returns the record and deletes it (single-use)', async () => {
    const store = memoryStore();
    const { state } = await createState(store, {
      platformId: 'p',
      nonce: 'n',
      targetLinkUri: 't',
      ttlMs: 60_000,
    });
    const first = await consumeState(store, state);
    expect(first).not.toBeNull();
    expect(first?.platformId).toBe('p');
    const second = await consumeState(store, state);
    expect(second).toBeNull(); // single-use
  });

  it('consumeState returns null for unknown state', async () => {
    const store = memoryStore();
    const r = await consumeState(store, 'does-not-exist');
    expect(r).toBeNull();
  });

  it('consumeState returns null when state is expired', async () => {
    const store = memoryStore();
    const { state } = await createState(store, {
      platformId: 'p',
      nonce: 'n',
      targetLinkUri: 't',
      ttlMs: -1000, // already expired
    });
    const r = await consumeState(store, state);
    expect(r).toBeNull();
  });
});
