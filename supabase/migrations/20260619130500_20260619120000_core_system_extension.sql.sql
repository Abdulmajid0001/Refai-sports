-- Core System Extension - Auth, Sessions, Devices, Audit (Module 1-2)
-- Extending existing system without removing features

-- ===============================
-- USER DEVICES (Module 1)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_devices') THEN
    CREATE TABLE user_devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL CHECK (device_type IN ('web', 'mobile', 'tablet')),
      browser TEXT,
      os TEXT,
      ip_address TEXT,
      user_agent TEXT,
      last_used TIMESTAMPTZ DEFAULT NOW(),
      is_trusted BOOLEAN DEFAULT false,
      is_current BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, device_name)
    );
    
    CREATE INDEX idx_user_devices_user ON user_devices(user_id);
    CREATE INDEX idx_user_devices_trusted ON user_devices(user_id, is_trusted);
    
    ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_own_devices" ON user_devices FOR SELECT
      TO authenticated USING (user_id = auth.uid());
    
    CREATE POLICY "insert_own_device" ON user_devices FOR INSERT
      TO authenticated WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "update_own_device" ON user_devices FOR UPDATE
      TO authenticated USING (user_id = auth.uid());
    
    CREATE POLICY "delete_own_device" ON user_devices FOR DELETE
      TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ===============================
-- USER SESSIONS (Module 1)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
    CREATE TABLE user_sessions (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      device_name TEXT,
      ip_address TEXT,
      location TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      last_activity TIMESTAMPTZ DEFAULT NOW(),
      is_current BOOLEAN DEFAULT false,
      expires_at TIMESTAMPTZ
    );
    
    CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
    
    ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_own_sessions" ON user_sessions FOR SELECT
      TO authenticated USING (user_id = auth.uid());
    
    CREATE POLICY "delete_own_sessions" ON user_sessions FOR DELETE
      TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ===============================
-- LEAGUE APPROVALS (Module 2-3)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_approvals') THEN
    CREATE TABLE league_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('starter', 'pro', 'elite')),
      billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'league_duration')),
      amount DECIMAL(10, 2) NOT NULL,
      payment_id TEXT,
      reviewed_by UUID REFERENCES auth.users(id),
      reviewed_at TIMESTAMPTZ,
      rejection_reason TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_league_approvals_status ON league_approvals(status);
    CREATE INDEX idx_league_approvals_created ON league_approvals(created_at DESC);
    
    ALTER TABLE league_approvals ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_approvals" ON league_approvals FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_league_approvals" ON league_approvals FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_league_approvals" ON league_approvals FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- LEAGUE SUBSCRIPTION TIERS (Module 3)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_subscriptions') THEN
    CREATE TABLE league_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'elite')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
      billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'league_duration')),
      amount DECIMAL(10, 2) NOT NULL,
      max_teams INTEGER NOT NULL DEFAULT 6,
      current_teams INTEGER DEFAULT 0,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      trial_ends_at TIMESTAMPTZ,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_league_subs_league ON league_subscriptions(league_id);
    CREATE INDEX idx_league_subs_status ON league_subscriptions(status);
    
    ALTER TABLE league_subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_subs" ON league_subscriptions FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_league_subs" ON league_subscriptions FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_league_subs" ON league_subscriptions FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- TEAM INVITES (Module 4)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_invites') THEN
    CREATE TABLE team_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'player' CHECK (role IN ('player', 'coach', 'assistant_coach', 'manager')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
      invited_by UUID REFERENCES auth.users(id),
      accepted_by UUID REFERENCES auth.users(id),
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_team_invites_team ON team_invites(team_id);
    CREATE INDEX idx_team_invites_token ON team_invites(token);
    CREATE INDEX idx_team_invites_email ON team_invites(email);
    
    ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_team_invites" ON team_invites FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_team_invites" ON team_invites FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_team_invites" ON team_invites FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- PLAYER PROFILES (Module 5)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_profiles') THEN
    CREATE TABLE player_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      jersey_number INTEGER,
      position TEXT,
      secondary_position TEXT,
      nationality TEXT,
      passport_id TEXT,
      passport_document_url TEXT,
      photo_url TEXT,
      jersey_photo_url TEXT,
      celebration_video_url TEXT,
      standing_video_url TEXT,
      height_cm INTEGER,
      weight_kg INTEGER,
      date_of_birth DATE,
      bio TEXT,
      kit_preferences JSONB DEFAULT '{"primary": null, "away": null, "goalkeeper": null}',
      social_links JSONB DEFAULT '{}',
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_player_profiles_user ON player_profiles(user_id);
    CREATE INDEX idx_player_profiles_team_member ON player_profiles(team_member_id);
    
    ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_player_profiles" ON player_profiles FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_player_profiles" ON player_profiles FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_player_profiles" ON player_profiles FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- FIXTURES (Module 6)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fixtures') THEN
    CREATE TABLE fixtures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      matchday INTEGER NOT NULL,
      home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      kickoff_at TIMESTAMPTZ NOT NULL,
      venue TEXT,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'postponed', 'cancelled')),
      round_type TEXT DEFAULT 'regular' CHECK (round_type IN ('regular', 'playoff', 'quarterfinal', 'semifinal', 'final', 'third_place')),
      group_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_fixtures_league ON fixtures(league_id);
    CREATE INDEX idx_fixtures_matchday ON fixtures(league_id, matchday);
    CREATE INDEX idx_fixtures_teams ON fixtures(home_team_id, away_team_id);
    CREATE INDEX idx_fixtures_kickoff ON fixtures(kickoff_at);
    
    ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_fixtures" ON fixtures FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_fixtures" ON fixtures FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_fixtures" ON fixtures FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- STANDINGS (Module 6)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'standings') THEN
    CREATE TABLE standings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      group_name TEXT,
      played INTEGER DEFAULT 0,
      won INTEGER DEFAULT 0,
      drawn INTEGER DEFAULT 0,
      lost INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      goals_against INTEGER DEFAULT 0,
      goal_difference INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      form TEXT DEFAULT '',
      position INTEGER,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(league_id, team_id, group_name)
    );
    
    CREATE INDEX idx_standings_league ON standings(league_id);
    CREATE INDEX idx_standings_team ON standings(team_id);
    CREATE INDEX idx_standings_group ON standings(league_id, group_name);
    
    ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_standings" ON standings FOR SELECT TO authenticated USING (true);
    CREATE POLICY "update_standings" ON standings FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- TOURNAMENT BRACKETS (Module 6)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournament_brackets') THEN
    CREATE TABLE tournament_brackets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      bracket_type TEXT NOT NULL CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin', 'group_stage')),
      teams JSONB DEFAULT '[]',
      rounds JSONB DEFAULT '[]',
      matches JSONB DEFAULT '[]',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
      winner_id UUID REFERENCES teams(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_tournament_brackets_league ON tournament_brackets(league_id);
    
    ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_tournament_brackets" ON tournament_brackets FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_tournament_brackets" ON tournament_brackets FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_tournament_brackets" ON tournament_brackets FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- MODERATOR ROLES (Module 7)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_moderators') THEN
    CREATE TABLE match_moderators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('general', 'var', 'replay', 'graphics', 'camera', 'commentator')),
      permissions TEXT[] DEFAULT '{}',
      is_lead BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'standby', 'disconnected')),
      last_activity TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(match_id, user_id, role)
    );
    
    CREATE INDEX idx_match_moderators_match ON match_moderators(match_id);
    CREATE INDEX idx_match_moderators_user ON match_moderators(user_id);
    CREATE INDEX idx_match_moderators_role ON match_moderators(role);
    
    ALTER TABLE match_moderators ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_match_moderators" ON match_moderators FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_match_moderators" ON match_moderators FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_match_moderators" ON match_moderators FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- VIEWER CUSTOM GRAPHICS (Module 8)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_viewer_settings') THEN
    CREATE TABLE league_viewer_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
      show_league_logo BOOLEAN DEFAULT true,
      custom_logo_url TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      accent_color TEXT,
      custom_fonts JSONB DEFAULT '{}',
      scoreboard_style TEXT DEFAULT 'default' CHECK (scoreboard_style IN ('default', 'minimal', 'classic', 'modern', 'custom')),
      custom_overlay_url TEXT,
      scoreboard_position TEXT DEFAULT 'top_center' CHECK (scoreboard_position IN ('top_left', 'top_center', 'top_right', 'bottom_left', 'bottom_center', 'bottom_right')),
      show_timer BOOLEAN DEFAULT true,
      show_score BOOLEAN DEFAULT true,
      show_team_logos BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_league_viewer_settings_league ON league_viewer_settings(league_id);
    
    ALTER TABLE league_viewer_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_viewer_settings" ON league_viewer_settings FOR SELECT TO authenticated USING (true);
    CREATE POLICY "update_league_viewer_settings" ON league_viewer_settings FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- MULTI-CAMERA SETUP (Module 9)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_cameras') THEN
    CREATE TABLE match_cameras (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('main', 'secondary', 'goal_line', 'overhead', 'tactical', 'crowd', 'drone', 'handheld')),
      stream_url TEXT,
      stream_type TEXT CHECK (stream_type IN ('webrtc', 'hls', 'rtmp')),
      status TEXT DEFAULT 'offline' CHECK (status IN ('active', 'standby', 'offline', 'error')),
      is_primary BOOLEAN DEFAULT false,
      resolution TEXT,
      framerate INTEGER DEFAULT 60,
      bitrate_kbps INTEGER,
      position_x DECIMAL(5, 2),
      position_y DECIMAL(5, 2),
      operator_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_match_cameras_match ON match_cameras(match_id);
    CREATE INDEX idx_match_cameras_status ON match_cameras(status);
    CREATE INDEX idx_match_cameras_primary ON match_cameras(match_id, is_primary);
    
    ALTER TABLE match_cameras ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_match_cameras" ON match_cameras FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_match_cameras" ON match_cameras FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_match_cameras" ON match_cameras FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- STREAM INGEST (Module 9)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stream_ingests') THEN
    CREATE TABLE stream_ingests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      ingest_url TEXT NOT NULL,
      stream_key TEXT,
      ingest_type TEXT NOT NULL CHECK (ingest_type IN ('rtmp', 'srt', 'rtsp', 'webrtc')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
      bandwidth_limit_kbps INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_stream_ingests_match ON stream_ingests(match_id);
    
    ALTER TABLE stream_ingests ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_stream_ingests" ON stream_ingests FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_stream_ingests" ON stream_ingests FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_stream_ingests" ON stream_ingests FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- COMMENTATOR ASSIGNMENTS (Module 9)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_commentators') THEN
    CREATE TABLE match_commentators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      language TEXT DEFAULT 'en',
      is_main BOOLEAN DEFAULT false,
      audio_channel INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'muted', 'disconnected')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(match_id, user_id)
    );
    
    CREATE INDEX idx_match_commentators_match ON match_commentators(match_id);
    CREATE INDEX idx_match_commentators_user ON match_commentators(user_id);
    
    ALTER TABLE match_commentators ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_match_commentators" ON match_commentators FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_match_commentators" ON match_commentators FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_match_commentators" ON match_commentators FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;
