-- LTI service custom tables (FR-9, FR-10).
-- Run once against the Supabase Postgres. ltijs-sequelize creates the
-- platform/idtoken/contexttoken/accesstoken tables automatically on startup.

CREATE SCHEMA IF NOT EXISTS lti;

CREATE TABLE IF NOT EXISTS lti.lti_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state           TEXT UNIQUE NOT NULL,
  nonce           TEXT NOT NULL,
  platform_id     TEXT NOT NULL,
  target_link_uri TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lti_state_expires_at_idx ON lti.lti_state (expires_at);

-- Single-use handoff-token ledger (FR-4). Used by the psko-app /lti/callback
-- route to reject replay attempts. Rows can be GC'd by `expires_at < now()`.
CREATE TABLE IF NOT EXISTS lti.lti_used_tokens (
  jti        TEXT PRIMARY KEY,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS lti_used_tokens_expires_at_idx ON lti.lti_used_tokens (expires_at);
