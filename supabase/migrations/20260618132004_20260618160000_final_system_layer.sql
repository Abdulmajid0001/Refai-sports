-- Final System Layer - Finance, Security, Scaling (Modules 21-25)
-- Tables for subscriptions, wallets, sponsors, security, performance

-- ===============================
-- LEAGUE WALLETS (Module 21)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_wallets') THEN
    CREATE TABLE league_wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
      available_balance DECIMAL(12, 2) DEFAULT 0,
      pending_balance DECIMAL(12, 2) DEFAULT 0,
      total_earned DECIMAL(12, 2) DEFAULT 0,
      total_withdrawn DECIMAL(12, 2) DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      stripe_account_id TEXT,
      paypal_email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_league_wallets_league ON league_wallets(league_id);
    
    ALTER TABLE league_wallets ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_wallets" ON league_wallets FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_league_wallets" ON league_wallets FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_league_wallets" ON league_wallets FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- WALLET TRANSACTIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') THEN
    CREATE TABLE wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
      amount DECIMAL(12, 2) NOT NULL,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
      reference TEXT,
      stripe_payment_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_wallet_tx_league ON wallet_transactions(league_id);
    CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at DESC);
    
    ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_wallet_tx" ON wallet_transactions FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_wallet_tx" ON wallet_transactions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- LEAGUE SUBSCRIPTIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_subscriptions') THEN
    CREATE TABLE league_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
      amount DECIMAL(10, 2) NOT NULL,
      interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
      current_period_start TIMESTAMPTZ NOT NULL,
      current_period_end TIMESTAMPTZ NOT NULL,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      updated_by UUID REFERENCES auth.users(id),
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

-- LEAGUE PAYOUTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'league_payouts') THEN
    CREATE TABLE league_payouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      amount DECIMAL(12, 2) NOT NULL,
      method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'stripe')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      reference TEXT,
      requested_by UUID REFERENCES auth.users(id),
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_league_payouts_league ON league_payouts(league_id);
    CREATE INDEX idx_league_payouts_status ON league_payouts(status);
    
    ALTER TABLE league_payouts ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_league_payouts" ON league_payouts FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_league_payouts" ON league_payouts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- AD SLOTS (Module 22)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_slots') THEN
    CREATE TABLE ad_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('banner', 'overlay', 'replay_sponsor', 'halftime', 'corner_graphic', 'scoreboard_logo')),
      position TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      price_per_view DECIMAL(10, 4) DEFAULT 0,
      min_duration INTEGER DEFAULT 5,
      max_duration INTEGER DEFAULT 60,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ad_slots_league ON ad_slots(league_id);
    CREATE INDEX idx_ad_slots_type ON ad_slots(type);
    
    ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ad_slots" ON ad_slots FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ad_slots" ON ad_slots FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_ad_slots" ON ad_slots FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- SPONSOR ADS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sponsor_ads') THEN
    CREATE TABLE sponsor_ads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
      sponsor_name TEXT NOT NULL,
      creative_url TEXT NOT NULL,
      click_url TEXT,
      impression_count INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      spend DECIMAL(10, 2) DEFAULT 0,
      budget DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ,
      targeting JSONB DEFAULT '{}',
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_sponsor_ads_slot ON sponsor_ads(slot_id);
    CREATE INDEX idx_sponsor_ads_status ON sponsor_ads(status);
    CREATE INDEX idx_sponsor_ads_created ON sponsor_ads(created_at DESC);
    
    ALTER TABLE sponsor_ads ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_sponsor_ads" ON sponsor_ads FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_sponsor_ads" ON sponsor_ads FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_sponsor_ads" ON sponsor_ads FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "delete_sponsor_ads" ON sponsor_ads FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- AD IMPRESSIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_impressions') THEN
    CREATE TABLE ad_impressions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL REFERENCES sponsor_ads(id) ON DELETE CASCADE,
      viewer_id UUID REFERENCES auth.users(id),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      ip_address TEXT,
      user_agent TEXT,
      cost DECIMAL(10, 4) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ad_impressions_ad ON ad_impressions(ad_id);
    CREATE INDEX idx_ad_impressions_created ON ad_impressions(created_at DESC);
    
    ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "insert_ad_impressions" ON ad_impressions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- API KEYS (Module 23)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
    CREATE TABLE api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      permissions TEXT[] DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
      created_by UUID REFERENCES auth.users(id),
      last_used_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX idx_api_keys_status ON api_keys(status);
    
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_api_keys" ON api_keys FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_api_keys" ON api_keys FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_api_keys" ON api_keys FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "delete_api_keys" ON api_keys FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- SECURITY EVENTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_events') THEN
    CREATE TABLE security_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL CHECK (type IN ('ddos', 'brute_force', 'suspicious_activity', 'rate_limit', 'auth_failure')),
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      source_ip TEXT NOT NULL,
      user_id UUID REFERENCES auth.users(id),
      blocked BOOLEAN DEFAULT false,
      details TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_security_events_type ON security_events(type);
    CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
    
    ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_security_events" ON security_events FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_security_events" ON security_events FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ===============================
-- PERFORMANCE METRICS (Module 24)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
    CREATE TABLE performance_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      metric_name TEXT NOT NULL,
      metric_value DECIMAL(12, 4) NOT NULL,
      unit TEXT,
      tags JSONB DEFAULT '{}',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_perf_metrics_match ON performance_metrics(match_id);
    CREATE INDEX idx_perf_metrics_name ON performance_metrics(metric_name);
    CREATE INDEX idx_perf_metrics_recorded ON performance_metrics(recorded_at DESC);
    
    ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_perf_metrics" ON performance_metrics FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_perf_metrics" ON performance_metrics FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- WEBSOCKET CONNECTIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'websocket_connections') THEN
    CREATE TABLE websocket_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      connection_id TEXT NOT NULL,
      connected_at TIMESTAMPTZ DEFAULT NOW(),
      disconnected_at TIMESTAMPTZ,
      messages_received INTEGER DEFAULT 0,
      messages_sent INTEGER DEFAULT 0,
      reconnects INTEGER DEFAULT 0
    );
    
    CREATE INDEX idx_ws_connections_match ON websocket_connections(match_id);
    CREATE INDEX idx_ws_connections_user ON websocket_connections(user_id);
    
    ALTER TABLE websocket_connections ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ws_connections" ON websocket_connections FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ws_connections" ON websocket_connections FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_ws_connections" ON websocket_connections FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- FEATURE FLAGS (Module 25)
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flags') THEN
    CREATE TABLE feature_flags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      enabled BOOLEAN DEFAULT false,
      rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
      targeting JSONB DEFAULT '{}',
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_feature_flags_name ON feature_flags(name);
    CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
    
    ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_feature_flags" ON feature_flags FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_feature_flags" ON feature_flags FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_feature_flags" ON feature_flags FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ===============================
-- CAMERA FEEDS
-- ===============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'camera_feeds') THEN
    CREATE TABLE camera_feeds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('main', 'secondary', 'goal_line', 'overhead', 'drone', 'handheld')),
      stream_url TEXT,
      status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('active', 'standby', 'offline', 'error')),
      resolution TEXT,
      bitrate INTEGER,
      framerate INTEGER DEFAULT 60,
      position_x DECIMAL(5, 2),
      position_y DECIMAL(5, 2),
      operator_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_camera_feeds_match ON camera_feeds(match_id);
    CREATE INDEX idx_camera_feeds_status ON camera_feeds(status);
    
    ALTER TABLE camera_feeds ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_camera_feeds" ON camera_feeds FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_camera_feeds" ON camera_feeds FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "update_camera_feeds" ON camera_feeds FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- AI EVENTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_events') THEN
    CREATE TABLE ai_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      model_name TEXT,
      confidence DECIMAL(5, 2),
      input_data JSONB,
      output_data JSONB,
      processing_time_ms INTEGER,
      gpu_used BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_events_match ON ai_events(match_id);
    CREATE INDEX idx_ai_events_type ON ai_events(event_type);
    CREATE INDEX idx_ai_events_created ON ai_events(created_at DESC);
    
    ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_ai_events" ON ai_events FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_ai_events" ON ai_events FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ANALYTICS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics') THEN
    CREATE TABLE analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
      metric_type TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      value DECIMAL(12, 4) NOT NULL,
      dimensions JSONB DEFAULT '{}',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_analytics_match ON analytics(match_id);
    CREATE INDEX idx_analytics_league ON analytics(league_id);
    CREATE INDEX idx_analytics_type ON analytics(metric_type);
    CREATE INDEX idx_analytics_recorded ON analytics(recorded_at DESC);
    
    ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_analytics" ON analytics FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_analytics" ON analytics FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
