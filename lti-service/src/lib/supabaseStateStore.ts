/**
 * Supabase-backed implementation of StateStore (see ./stateToken).
 *
 * Talks to the `lti_state` table (see db/migrations/001_init.sql).
 *
 * NOTE: writes use the service-role key. We do a SELECT-then-DELETE to keep
 * the abstraction simple; Postgres-level concurrency isn't a problem because
 * each launch resolves a unique UUID `state`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StateRecord, StateStore } from './stateToken';

export function createSupabaseStateStore(
  supabaseUrl: string,
  serviceRoleKey: string,
  client?: SupabaseClient,
): StateStore {
  const sb =
    client ??
    createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'lti' },
    });

  return {
    async insert(record: StateRecord) {
      const { error } = await sb.from('lti_state').insert({
        state: record.state,
        nonce: record.nonce,
        platform_id: record.platformId,
        target_link_uri: record.targetLinkUri,
        expires_at: record.expiresAt.toISOString(),
      });
      if (error) throw new Error(`lti_state.insert: ${error.message}`);
    },
    async take(state: string) {
      const { data, error } = await sb
        .from('lti_state')
        .select('state, nonce, platform_id, target_link_uri, expires_at')
        .eq('state', state)
        .maybeSingle();
      if (error) throw new Error(`lti_state.select: ${error.message}`);
      if (!data) return null;
      // Single-use: delete regardless of expiry.
      await sb.from('lti_state').delete().eq('state', state);
      return {
        state: data.state as string,
        nonce: data.nonce as string,
        platformId: data.platform_id as string,
        targetLinkUri: data.target_link_uri as string,
        expiresAt: new Date(data.expires_at as string),
      };
    },
  };
}
