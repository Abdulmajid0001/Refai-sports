-- =============================================================
-- Security Fix: Immutable search_path & revoke public EXECUTE on SECURITY DEFINER functions
-- =============================================================

-- 1. Fix mutable search_path on all functions (set search_path=public)
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.is_admin_or_match_admin() SET search_path = public;
ALTER FUNCTION public.is_admin_or_match_admin_or_referee() SET search_path = public;
-- These already have search_path=public but ensure consistency:
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_league_admin(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_league_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_team_owner(uuid, uuid) SET search_path = public;

-- 2. Revoke EXECUTE from anon on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_match_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_match_admin_or_referee() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_league_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_league_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) FROM anon;

-- 3. Revoke EXECUTE from authenticated on functions that should only be called internally
--    (used in RLS policies, not directly via RPC)
--    handle_new_user is a trigger — no one needs direct RPC access
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
--    has_role, is_admin_or_match_admin, is_admin_or_match_admin_or_referee, 
--    is_league_admin, is_league_owner, is_team_owner are RLS helpers — 
--    revoke from authenticated to prevent direct RPC abuse
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_match_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_match_admin_or_referee() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_league_admin(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_league_owner(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) FROM authenticated;

-- 4. Also revoke from anon/authenticated on the trigger function (not SECURITY DEFINER but still exposed)
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM authenticated;
