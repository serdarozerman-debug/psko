# Supabase Custom Access Token Hook

This directory documents the auth hook PSKO uses to inject the user's role
(`STUDENT` | `EDUCATOR`) into the JWT's `app_metadata.role` claim.

## What it does

The Postgres function `public.custom_access_token_hook` (defined in
[`../prisma/sql/access_token_hook.sql`](../prisma/sql/access_token_hook.sql))
runs every time Supabase Auth issues an access token. It:

1. Reads the user's `role` column from `public.users` keyed by `event->>'user_id'`.
2. Defaults to `'STUDENT'` if no matching row exists.
3. Sets `claims.app_metadata.role` on the returned event.

This lets Next.js middleware authorize `/educator/*` routes directly from the
JWT — no extra database round-trip per request.

> Role lives in **`app_metadata`**, never `user_metadata`. `user_metadata` is
> writable by the end user and would be a privilege-escalation vector.

## Applying the function

The SQL is **not** auto-applied by Prisma — it lives outside the migration
chain on purpose, so it can be reviewed and re-applied independently.

```bash
# Local (Supabase CLI)
psql "$DATABASE_URL" -f psko-app/prisma/sql/access_token_hook.sql

# Production: paste the file's contents into the Supabase Dashboard SQL editor
# and run once.
```

## Registering the hook in Supabase

Once the function exists in the database:

1. Open the Supabase Dashboard → your project.
2. Go to **Authentication → Hooks** (under the *Configuration* section).
3. Find **Custom Access Token Hook** and click **Enable**.
4. Choose the Postgres function `public.custom_access_token_hook`.
5. Save.

From now on every newly minted JWT will carry `app_metadata.role`.

## Important: re-apply after `supabase db reset`

`supabase db reset` (and any local DB wipe) drops user-defined functions
along with the schema. You must:

1. Re-run `prisma/sql/access_token_hook.sql` against the fresh DB.
2. Re-enable the hook in **Authentication → Hooks** if the dashboard config
   was tied to that database.

Existing users will need to sign out / sign in again (or have their token
refreshed) before the new claim appears in their JWT.

## Verifying the hook is wired up

After signing in, decode the access token (e.g. with `jwt.io`) and confirm
the payload contains:

```json
{
  "app_metadata": {
    "role": "EDUCATOR"
  }
}
```

If `role` is missing, the hook is either not registered or the function is
not present in the database.
