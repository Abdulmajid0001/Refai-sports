-- Security fix part 1: Replace critical insecure RLS policies that use "true"

-- 1. api_keys - uses created_by column
DROP POLICY IF EXISTS delete_api_keys ON api_keys;
DROP POLICY IF EXISTS insert_api_keys ON api_keys;
DROP POLICY IF EXISTS select_api_keys ON api_keys;
DROP POLICY IF EXISTS update_api_keys ON api_keys;

CREATE POLICY "select_own_api_keys" ON api_keys FOR SELECT
  TO authenticated USING (created_by = auth.uid());
CREATE POLICY "insert_own_api_keys" ON api_keys FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "update_own_api_keys" ON api_keys FOR UPDATE
  TO authenticated USING (created_by = auth.uid());
CREATE POLICY "delete_own_api_keys" ON api_keys FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- 2. ai_events - restrict insert to moderators
DROP POLICY IF EXISTS insert_ai_events ON ai_events;
DROP POLICY IF EXISTS select_ai_events ON ai_events;
CREATE POLICY "select_ai_events_public" ON ai_events FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_ai_events_mod" ON ai_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = ai_events.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator', 'var_moderator'))
  );

-- 3. ai_match_analysis - restrict insert
DROP POLICY IF EXISTS insert_ai_analysis_ai ON ai_match_analysis;
DROP POLICY IF EXISTS select_ai_analysis_ai ON ai_match_analysis;
CREATE POLICY "select_ai_analysis_public" ON ai_match_analysis FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_ai_analysis_mod" ON ai_match_analysis FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = ai_match_analysis.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'var_moderator'))
  );

-- 4. analytics - admin only
DROP POLICY IF EXISTS insert_analytics ON analytics;
DROP POLICY IF EXISTS select_analytics ON analytics;
CREATE POLICY "select_analytics_admin" ON analytics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 5. ball_events - restrict insert
DROP POLICY IF EXISTS insert_ball_events_ai ON ball_events;
DROP POLICY IF EXISTS select_ball_events_ai ON ball_events;
CREATE POLICY "select_ball_events_public" ON ball_events FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_ball_events_mod" ON ball_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = ball_events.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );

-- 6. broadcast_state - restrict to moderators
DROP POLICY IF EXISTS delete_broadcast_state ON broadcast_state;
DROP POLICY IF EXISTS insert_broadcast_state ON broadcast_state;
DROP POLICY IF EXISTS select_broadcast_state ON broadcast_state;
DROP POLICY IF EXISTS update_broadcast_state ON broadcast_state;
CREATE POLICY "select_broadcast_public" ON broadcast_state FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_broadcast_mod" ON broadcast_state FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = broadcast_state.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'graphics_moderator'))
  );
CREATE POLICY "update_broadcast_mod" ON broadcast_state FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = broadcast_state.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'graphics_moderator'))
  );

-- 7. camera_feeds - restrict
DROP POLICY IF EXISTS insert_camera_feeds ON camera_feeds;
DROP POLICY IF EXISTS select_camera_feeds ON camera_feeds;
DROP POLICY IF EXISTS update_camera_feeds ON camera_feeds;
CREATE POLICY "select_camera_match" ON camera_feeds FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = camera_feeds.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "insert_camera_op" ON camera_feeds FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = camera_feeds.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );
CREATE POLICY "update_camera_op" ON camera_feeds FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = camera_feeds.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'camera_operator'))
  );

-- 8. coaches - restrict write
DROP POLICY IF EXISTS insert_coaches ON coaches;
DROP POLICY IF EXISTS select_coaches ON coaches;
DROP POLICY IF EXISTS update_coaches ON coaches;
CREATE POLICY "select_coaches_public" ON coaches FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_coaches_owner" ON coaches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = coaches.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );
CREATE POLICY "update_coaches_owner" ON coaches FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = coaches.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 9. feature_flags - admin only
DROP POLICY IF EXISTS insert_feature_flags ON feature_flags;
DROP POLICY IF EXISTS select_feature_flags ON feature_flags;
DROP POLICY IF EXISTS update_feature_flags ON feature_flags;
CREATE POLICY "select_feature_flags_admin" ON feature_flags FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "insert_feature_flags_admin" ON feature_flags FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "update_feature_flags_admin" ON feature_flags FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 10. fixtures - restrict write
DROP POLICY IF EXISTS insert_fixtures ON fixtures;
DROP POLICY IF EXISTS select_fixtures ON fixtures;
DROP POLICY IF EXISTS update_fixtures ON fixtures;
CREATE POLICY "select_fixtures_public" ON fixtures FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_fixtures_owner" ON fixtures FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = fixtures.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );
CREATE POLICY "update_fixtures_owner" ON fixtures FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = fixtures.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 11. graphics_events - restrict to graphics moderator
DROP POLICY IF EXISTS insert_graphics_events ON graphics_events;
DROP POLICY IF EXISTS select_graphics_events ON graphics_events;
CREATE POLICY "select_graphics_public" ON graphics_events FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_graphics_mod" ON graphics_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = graphics_events.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'graphics_moderator'))
  );

-- 12. league_ai_settings - restrict to league owner
DROP POLICY IF EXISTS insert_ai_settings_ai ON league_ai_settings;
DROP POLICY IF EXISTS select_ai_settings_ai ON league_ai_settings;
DROP POLICY IF EXISTS update_ai_settings_ai ON league_ai_settings;
CREATE POLICY "select_ai_settings_owner" ON league_ai_settings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_ai_settings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "insert_ai_settings_owner" ON league_ai_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_ai_settings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "update_ai_settings_owner" ON league_ai_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = league_ai_settings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 13. live_match_overview - use status column (not is_live)
DROP POLICY IF EXISTS select_live_overview ON live_match_overview;
CREATE POLICY "select_live_overview_public" ON live_match_overview FOR SELECT
  TO authenticated USING (status = 'live' OR status = 'live'::text);
