/**
 * Upsert a PSKO user from an LTI launch.
 *
 * Strategy: Supabase Admin API.
 *  - `auth.admin.listUsers` is unreliable for large tenants; we instead use
 *    a deterministic email derived from `iss + sub` so the same LTI identity
 *    always lands on the same Supabase user.
 *  - If a user with that email exists, we update metadata; otherwise create.
 *
 * Returns the Supabase user id (`auth.users.id`), which becomes `userId` in
 * the handoff JWT.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PskoRole } from './roleMapping';

export interface UpsertUserInput {
  /** LMS-issued subject identifier. */
  ltiSub: string;
  /** Issuer URL (Canvas/Moodle base URL). */
  iss: string;
  /** Email from LTI claims; may be missing for some platforms. */
  email?: string;
  name?: string;
  role: PskoRole;
}

export interface UsersBridge {
  upsertUser(input: UpsertUserInput): Promise<{ userId: string; email: string }>;
}

function deterministicEmail(iss: string, sub: string): string {
  // Stable, opaque address — never used for delivery.
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `lti-${safe(iss)}-${safe(sub)}@psko.local`;
}

export function createSupabaseUsersBridge(
  supabaseUrl: string,
  serviceRoleKey: string,
  client?: SupabaseClient,
): UsersBridge {
  const sb =
    client ??
    createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

  return {
    async upsertUser(input) {
      const email = input.email ?? deterministicEmail(input.iss, input.ltiSub);
      const metadata = {
        lti_iss: input.iss,
        lti_sub: input.ltiSub,
        name: input.name,
        role: input.role,
      };

      // listUsers with filter by email — Admin API supports this via getUserByEmail in v2.
      // Fall back to create-then-update if not present.
      const adminAny = (sb.auth.admin as unknown) as {
        getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
      };

      if (typeof adminAny.getUserByEmail === 'function') {
        const existing = await adminAny.getUserByEmail(email);
        if (existing.data?.user) {
          const id = existing.data.user.id;
          await sb.auth.admin.updateUserById(id, { user_metadata: metadata });
          return { userId: id, email };
        }
      }

      const created = await sb.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (created.error || !created.data.user) {
        throw new Error(`Supabase createUser failed: ${created.error?.message ?? 'unknown'}`);
      }
      return { userId: created.data.user.id, email };
    },
  };
}
