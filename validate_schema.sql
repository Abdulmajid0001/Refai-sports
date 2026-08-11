CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin','league_owner','team_owner','coach','moderator','camera_operator','commentator','viewer','sponsor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'CREATE ROLE authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'CREATE ROLE anon';
  END IF;
END;
$$;
CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_roles(user_id uuid REFERENCES auth.users(id), role public.app_role);
CREATE TABLE IF NOT EXISTS public.leagues(id uuid PRIMARY KEY, owner_id uuid REFERENCES auth.users(id));
CREATE TABLE IF NOT EXISTS public.matches(id uuid PRIMARY KEY, league_id uuid REFERENCES public.leagues(id));
CREATE TABLE IF NOT EXISTS public.teams(id uuid PRIMARY KEY, owner_id uuid REFERENCES auth.users(id));
CREATE TABLE IF NOT EXISTS public.subscription_plans(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.player_profiles(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.profiles(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.league_registrations(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.league_wallets(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.team_invites(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.team_registrations(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.bge_templates(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.broadcast_state(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.change_history_logs(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.coaches(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.comm_messages(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.custom_formations(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.graphics_events(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.moderator_actions(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.moderator_announcements(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.player_registrations(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.replay_3d_state(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.replay_clips(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.replay_queue(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.scoreboard_history(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.stream_analytics(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.var_reviews(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.team_members(id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.ad_slots(id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION public.has_role(uuid, public.app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.is_admin_or_match_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.is_admin_or_match_admin_or_referee() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.is_league_admin(uuid, uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.is_league_owner(uuid, uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.is_team_owner(uuid, uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
