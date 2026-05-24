-- Supabase Custom Access Token Hook
-- Injects the user's PSKO role (STUDENT | EDUCATOR) into app_metadata
-- so middleware can gate /educator/* routes from the JWT without DB queries.
--
-- Registration in Supabase Dashboard:
--   Authentication → Hooks → Custom Access Token Hook
--   → Select this function: public.custom_access_token_hook
--
-- Reference: https://supabase.com/docs/guides/auth/auth-hooks#custom-access-token-hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  claims    jsonb;
BEGIN
  -- Look up the user's role in the PSKO users table
  SELECT role::text INTO user_role
  FROM public.users
  WHERE id = event->>'user_id';

  -- Default to STUDENT if not found (safe default, FR-1.5)
  IF user_role IS NULL THEN
    user_role := 'STUDENT';
  END IF;

  -- Merge role into app_metadata (never user_metadata — FR-1.5)
  claims := event->'claims';
  claims := jsonb_set(
    claims,
    '{app_metadata,role}',
    to_jsonb(user_role)
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execution rights to the auth hook caller
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public (only auth admin should call this)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
