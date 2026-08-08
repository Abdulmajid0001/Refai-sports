-- Broadcast Graphics Engine tables

-- 1. coaches
CREATE TABLE public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  nationality text,
  photo_url text,
  role text DEFAULT 'head_coach',
  years_coaching integer,
  formation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_coaches" ON public.coaches FOR SELECT TO authenticated USING (auth.uid() = (SELECT owner_id FROM public.teams WHERE id = team_id));
CREATE POLICY "insert_own_coaches" ON public.coaches FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT owner_id FROM public.teams WHERE id = team_id));
CREATE POLICY "update_own_coaches" ON public.coaches FOR UPDATE TO authenticated USING (auth.uid() = (SELECT owner_id FROM public.teams WHERE id = team_id)) WITH CHECK (auth.uid() = (SELECT owner_id FROM public.teams WHERE id = team_id));
CREATE POLICY "delete_own_coaches" ON public.coaches FOR DELETE TO authenticated USING (auth.uid() = (SELECT owner_id FROM public.teams WHERE id = team_id));

-- 2. graphics_events - the core BGE event log
CREATE TABLE public.graphics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  graphic_type text NOT NULL,
  display_mode text NOT NULL DEFAULT 'popup',
  payload jsonb NOT NULL DEFAULT '{}',
  auto_dismiss_ms integer,
  pushed_at timestamptz,
  dismissed_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.graphics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_match_graphics" ON public.graphics_events FOR SELECT TO authenticated USING (match_id IN (SELECT id FROM public.matches));
CREATE POLICY "insert_match_graphics" ON public.graphics_events FOR INSERT TO authenticated WITH CHECK (match_id IN (SELECT id FROM public.matches));
CREATE POLICY "update_own_graphics" ON public.graphics_events FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "delete_own_graphics" ON public.graphics_events FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 3. match_stats - structured stats storage
CREATE TABLE public.match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  stats jsonb NOT NULL DEFAULT '{}',
  period text DEFAULT 'full',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_match_stats" ON public.match_stats FOR SELECT TO authenticated USING (match_id IN (SELECT id FROM public.matches));
CREATE POLICY "insert_match_stats" ON public.match_stats FOR INSERT TO authenticated WITH CHECK (match_id IN (SELECT id FROM public.matches));
CREATE POLICY "update_own_stats" ON public.match_stats FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "delete_own_stats" ON public.match_stats FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 4. scoreboard_history - tracks score changes
CREATE TABLE public.scoreboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  minute integer,
  event_type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.scoreboard_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_scoreboard" ON public.scoreboard_history FOR SELECT TO authenticated USING (match_id IN (SELECT id FROM public.matches));
CREATE POLICY "insert_scoreboard" ON public.scoreboard_history FOR INSERT TO authenticated WITH CHECK (match_id IN (SELECT id FROM public.matches));

-- 5. Add columns to existing player_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'jersey_number') THEN
    ALTER TABLE public.player_profiles ADD COLUMN jersey_number integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'preferred_name') THEN
    ALTER TABLE public.player_profiles ADD COLUMN preferred_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'team_id') THEN
    ALTER TABLE public.player_profiles ADD COLUMN team_id uuid REFERENCES public.teams(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'passport_id') THEN
    ALTER TABLE public.player_profiles ADD COLUMN passport_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'full_body_photo_url') THEN
    ALTER TABLE public.player_profiles ADD COLUMN full_body_photo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'contract_start') THEN
    ALTER TABLE public.player_profiles ADD COLUMN contract_start date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'contract_end') THEN
    ALTER TABLE public.player_profiles ADD COLUMN contract_end date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'previous_clubs') THEN
    ALTER TABLE public.player_profiles ADD COLUMN previous_clubs text[];
  END IF;
END $$;

-- 6. Add columns to existing leagues
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'season_name') THEN
    ALTER TABLE public.leagues ADD COLUMN season_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'opening_date') THEN
    ALTER TABLE public.leagues ADD COLUMN opening_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'closing_date') THEN
    ALTER TABLE public.leagues ADD COLUMN closing_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'num_teams') THEN
    ALTER TABLE public.leagues ADD COLUMN num_teams integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'players_per_team') THEN
    ALTER TABLE public.leagues ADD COLUMN players_per_team integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'competition_format') THEN
    ALTER TABLE public.leagues ADD COLUMN competition_format text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'prize_pool') THEN
    ALTER TABLE public.leagues ADD COLUMN prize_pool text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'sponsors') THEN
    ALTER TABLE public.leagues ADD COLUMN sponsors text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'broadcast_rights') THEN
    ALTER TABLE public.leagues ADD COLUMN broadcast_rights text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'website_url') THEN
    ALTER TABLE public.leagues ADD COLUMN website_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'contact_email') THEN
    ALTER TABLE public.leagues ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leagues' AND column_name = 'owner_logo_url') THEN
    ALTER TABLE public.leagues ADD COLUMN owner_logo_url text;
  END IF;
END $$;

-- 7. Add columns to existing teams
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'founded_year') THEN
    ALTER TABLE public.teams ADD COLUMN founded_year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'captain_id') THEN
    ALTER TABLE public.teams ADD COLUMN captain_id uuid REFERENCES public.player_profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'contact_email') THEN
    ALTER TABLE public.teams ADD COLUMN contact_email text;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_graphics_events_match ON public.graphics_events(match_id);
CREATE INDEX IF NOT EXISTS idx_scoreboard_history_match ON public.scoreboard_history(match_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match ON public.match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_coaches_team ON public.coaches(team_id);
