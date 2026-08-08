-- AI Sports Intelligence Layer Extension (Part 2)
-- Using user_roles instead of league_members for RLS

-- ===============================
-- VAR Reviews Table (Module 14)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'var_reviews') THEN
    CREATE TABLE var_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      incident_type TEXT NOT NULL CHECK (incident_type IN ('foul', 'offside', 'handball', 'goal', 'penalty', 'card')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
      confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
      minute INTEGER NOT NULL,
      description TEXT,
      ai_reasoning TEXT,
      suggested_decision TEXT CHECK (suggested_decision IN ('confirm', 'reject', 'escalate')),
      decision TEXT CHECK (decision IN ('confirm', 'reject', 'escalate')),
      created_by UUID REFERENCES auth.users(id),
      decided_by UUID REFERENCES auth.users(id),
      decided_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_var_reviews_match_ai ON var_reviews(match_id);
    CREATE INDEX idx_var_reviews_created_ai ON var_reviews(created_at DESC);
    
    ALTER TABLE var_reviews ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_var_reviews_ai" ON var_reviews FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_var_reviews_ai" ON var_reviews FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_var_reviews_ai" ON var_reviews FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- AI Match Analysis Table (Module 15)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_match_analysis') THEN
    CREATE TABLE ai_match_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      minute INTEGER NOT NULL,
      goal_probability JSONB DEFAULT '{"home": 0, "away": 0}',
      momentum JSONB DEFAULT '[]',
      injury_risks JSONB DEFAULT '[]',
      tactical_changes JSONB DEFAULT '[]',
      insights JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_analysis_match_ai ON ai_match_analysis(match_id);
    CREATE INDEX idx_ai_analysis_minute_ai ON ai_match_analysis(match_id, minute);
    
    ALTER TABLE ai_match_analysis ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ai_analysis_ai" ON ai_match_analysis FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ai_analysis_ai" ON ai_match_analysis FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- Ball Tracking Events Table (Module 16)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ball_events') THEN
    CREATE TABLE ball_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
      data JSONB DEFAULT '{}',
      confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ball_events_match_ai ON ball_events(match_id);
    CREATE INDEX idx_ball_events_type_ai ON ball_events(match_id, event_type);
    CREATE INDEX idx_ball_events_created_ai ON ball_events(created_at DESC);
    
    ALTER TABLE ball_events ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ball_events_ai" ON ball_events FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ball_events_ai" ON ball_events FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- Ball Tracking Exports
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ball_tracking_exports') THEN
    CREATE TABLE ball_tracking_exports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ball_exports_match_ai ON ball_tracking_exports(match_id);
    
    ALTER TABLE ball_tracking_exports ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ball_exports_ai" ON ball_tracking_exports FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- League AI Settings Table (Module 17)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_ai_settings') THEN
    CREATE TABLE league_ai_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
      settings JSONB NOT NULL DEFAULT '{}',
      updated_by UUID REFERENCES auth.users(id),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_settings_league_ai ON league_ai_settings(league_id);
    
    ALTER TABLE league_ai_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ai_settings_ai" ON league_ai_settings FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ai_settings_ai" ON league_ai_settings FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_ai_settings_ai" ON league_ai_settings FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- League Features Table (Module 18)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_features') THEN
    CREATE TABLE league_features (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      feature_id TEXT NOT NULL,
      enabled BOOLEAN DEFAULT false,
      updated_by UUID REFERENCES auth.users(id),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(league_id, feature_id)
    );
    
    CREATE INDEX idx_league_features_league_ai ON league_features(league_id);
    CREATE INDEX idx_league_features_feature_ai ON league_features(league_id, feature_id);
    
    ALTER TABLE league_features ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_features_ai" ON league_features FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_league_features_ai" ON league_features FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_league_features_ai" ON league_features FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- Voice Commands Table (Module 19)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_commands') THEN
    CREATE TABLE voice_commands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      command TEXT NOT NULL,
      action TEXT NOT NULL,
      success BOOLEAN DEFAULT false,
      confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_voice_commands_match_ai ON voice_commands(match_id);
    CREATE INDEX idx_voice_commands_created_ai ON voice_commands(created_at DESC);
    
    ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_voice_commands_ai" ON voice_commands FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_voice_commands_ai" ON voice_commands FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- Match Archives Table (Module 20)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_archives') THEN
    CREATE TABLE match_archives (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
      status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('ready', 'processing', 'error')),
      storage_size DECIMAL(10, 2) DEFAULT 0,
      has_var BOOLEAN DEFAULT false,
      has_replays BOOLEAN DEFAULT false,
      has_stats BOOLEAN DEFAULT false,
      has_tracking BOOLEAN DEFAULT false,
      archive_path TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_match_archives_match_ai ON match_archives(match_id);
    CREATE INDEX idx_match_archives_status_ai ON match_archives(status);
    CREATE INDEX idx_match_archives_created_ai ON match_archives(created_at DESC);
    
    ALTER TABLE match_archives ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_match_archives_ai" ON match_archives FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_match_archives_ai" ON match_archives FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_match_archives_ai" ON match_archives FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- Archive Downloads Tracking
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'archive_downloads') THEN
    CREATE TABLE archive_downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      archive_id UUID NOT NULL REFERENCES match_archives(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      downloaded_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_archive_downloads_archive_ai ON archive_downloads(archive_id);
    CREATE INDEX idx_archive_downloads_user_ai ON archive_downloads(user_id);
    
    ALTER TABLE archive_downloads ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_own_downloads_ai" ON archive_downloads FOR SELECT TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "insert_downloads_ai" ON archive_downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ===============================
-- Broadcast State Table (for VAR overlay push)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'broadcast_state') THEN
    CREATE TABLE broadcast_state (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
      var_screen_mode TEXT DEFAULT 'none' CHECK (var_screen_mode IN ('none', 'half', 'full')),
      var_active BOOLEAN DEFAULT false,
      var_incident_type TEXT,
      var_confidence INTEGER,
      current_graphic_type TEXT,
      current_graphic_data JSONB,
      updated_by UUID REFERENCES auth.users(id),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_broadcast_state_match_ai ON broadcast_state(match_id);
    
    ALTER TABLE broadcast_state ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_broadcast_state_ai" ON broadcast_state FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_broadcast_state_ai" ON broadcast_state FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_broadcast_state_ai" ON broadcast_state FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;
