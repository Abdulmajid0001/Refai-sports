-- Security fix part 2: Continue fixing insecure RLS policies

-- 1. league_custom_graphics - restrict to league owner
DROP POLICY IF EXISTS select_custom_graphics ON league_custom_graphics;
CREATE POLICY "select_custom_graphics_owner" ON league_custom_graphics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_custom_graphics.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 2. league_documents - restrict to league owner
DROP POLICY IF EXISTS select_league_docs ON league_documents;
CREATE POLICY "select_league_docs_owner" ON league_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_documents.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 3. league_features - restrict to admin
DROP POLICY IF EXISTS insert_league_features_ai ON league_features;
DROP POLICY IF EXISTS select_league_features_ai ON league_features;
DROP POLICY IF EXISTS update_league_features_ai ON league_features;
CREATE POLICY "select_league_features_public" ON league_features FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_league_features_admin" ON league_features FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "update_league_features_admin" ON league_features FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 4. league_payouts - restrict to league owner
DROP POLICY IF EXISTS insert_league_payouts ON league_payouts;
DROP POLICY IF EXISTS select_league_payouts ON league_payouts;
CREATE POLICY "select_payouts_owner" ON league_payouts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_payouts.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 5. league_viewer_settings - restrict to league owner
DROP POLICY IF EXISTS select_league_viewer_settings ON league_viewer_settings;
DROP POLICY IF EXISTS update_league_viewer_settings ON league_viewer_settings;
CREATE POLICY "select_viewer_settings_owner" ON league_viewer_settings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_viewer_settings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "update_viewer_settings_owner" ON league_viewer_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_viewer_settings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 6. league_wallets - restrict to league owner
DROP POLICY IF EXISTS insert_league_wallets ON league_wallets;
DROP POLICY IF EXISTS select_league_wallets ON league_wallets;
DROP POLICY IF EXISTS update_league_wallets ON league_wallets;
CREATE POLICY "select_wallets_owner" ON league_wallets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_wallets.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 7. match_archives - restrict write
DROP POLICY IF EXISTS insert_match_archives_ai ON match_archives;
DROP POLICY IF EXISTS select_match_archives_ai ON match_archives;
DROP POLICY IF EXISTS update_match_archives_ai ON match_archives;
CREATE POLICY "select_archives_public" ON match_archives FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_archives_admin" ON match_archives FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );
CREATE POLICY "update_archives_admin" ON match_archives FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );

-- 8. match_cameras - restrict to operators
DROP POLICY IF EXISTS insert_match_cameras ON match_cameras;
DROP POLICY IF EXISTS select_match_cameras ON match_cameras;
DROP POLICY IF EXISTS update_match_cameras ON match_cameras;
CREATE POLICY "select_match_cameras_op" ON match_cameras FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = match_cameras.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "insert_match_cameras_op" ON match_cameras FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = match_cameras.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "update_match_cameras_op" ON match_cameras FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = match_cameras.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );

-- 9. match_commentators - restrict to commentators
DROP POLICY IF EXISTS insert_match_commentators ON match_commentators;
DROP POLICY IF EXISTS select_match_commentators ON match_commentators;
DROP POLICY IF EXISTS update_match_commentators ON match_commentators;
CREATE POLICY "select_commentators_public" ON match_commentators FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_commentators_league" ON match_commentators FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM leagues l JOIN matches m ON m.league_id = l.id WHERE m.id = match_commentators.match_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'commentator'))
  );
CREATE POLICY "update_commentators_self" ON match_commentators FOR UPDATE
  TO authenticated USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 10. match_moderators - restrict to league owner
DROP POLICY IF EXISTS insert_match_moderators ON match_moderators;
DROP POLICY IF EXISTS select_match_moderators ON match_moderators;
DROP POLICY IF EXISTS update_match_moderators ON match_moderators;
CREATE POLICY "select_moderators_owner" ON match_moderators FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM leagues l JOIN matches m ON m.league_id = l.id WHERE m.id = match_moderators.match_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "insert_moderators_owner" ON match_moderators FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM leagues l JOIN matches m ON m.league_id = l.id WHERE m.id = match_moderators.match_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 11. match_stats - restrict to moderator
DROP POLICY IF EXISTS insert_match_stats ON match_stats;
DROP POLICY IF EXISTS select_match_stats ON match_stats;
CREATE POLICY "select_match_stats_public" ON match_stats FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_match_stats_mod" ON match_stats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = match_stats.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );

-- 12. performance_metrics - admin only
DROP POLICY IF EXISTS insert_perf_metrics ON performance_metrics;
DROP POLICY IF EXISTS select_perf_metrics ON performance_metrics;
CREATE POLICY "select_perf_admin" ON performance_metrics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 13. security_events - admin only
DROP POLICY IF EXISTS insert_security_events ON security_events;
DROP POLICY IF EXISTS select_security_events ON security_events;
CREATE POLICY "select_security_admin" ON security_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 14. stream_analytics - league owner only
DROP POLICY IF EXISTS insert_stream_analytics ON stream_analytics;
DROP POLICY IF EXISTS select_stream_analytics ON stream_analytics;
CREATE POLICY "select_stream_analytics_owner" ON stream_analytics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues l JOIN matches m ON m.league_id = l.id WHERE m.id = stream_analytics.match_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 15. stream_cameras - restrict to operator
DROP POLICY IF EXISTS insert_stream_cameras ON stream_cameras;
DROP POLICY IF EXISTS select_stream_cameras ON stream_cameras;
DROP POLICY IF EXISTS update_stream_cameras ON stream_cameras;
CREATE POLICY "select_stream_cameras_op" ON stream_cameras FOR SELECT
  TO authenticated USING (
    operator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = stream_cameras.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "insert_stream_cameras_op" ON stream_cameras FOR INSERT
  TO authenticated WITH CHECK (
    operator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "update_stream_cameras_op" ON stream_cameras FOR UPDATE
  TO authenticated USING (
    operator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );

-- 16. stream_ingests - restrict to moderator
DROP POLICY IF EXISTS insert_stream_ingests ON stream_ingests;
DROP POLICY IF EXISTS select_stream_ingests ON stream_ingests;
DROP POLICY IF EXISTS update_stream_ingests ON stream_ingests;
CREATE POLICY "select_ingests_mod" ON stream_ingests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = stream_ingests.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );
CREATE POLICY "insert_ingests_mod" ON stream_ingests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = stream_ingests.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );
CREATE POLICY "update_ingests_mod" ON stream_ingests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = stream_ingests.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );
