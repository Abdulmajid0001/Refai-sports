-- Security fix part 3: Final tables with insecure RLS policies

-- 1. team_members - restrict write
DROP POLICY IF EXISTS select_team_members ON team_members;
CREATE POLICY "select_team_members_public" ON team_members FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_team_members_owner" ON team_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'team_owner'))
  );
CREATE POLICY "update_team_members_owner" ON team_members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'team_owner'))
  );
CREATE POLICY "delete_team_members_owner" ON team_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'team_owner'))
  );

-- 2. var_reviews - restrict to VAR moderator
DROP POLICY IF EXISTS insert_var_reviews ON var_reviews;
DROP POLICY IF EXISTS select_var_reviews ON var_reviews;
DROP POLICY IF EXISTS update_var_reviews ON var_reviews;
CREATE POLICY "select_var_public" ON var_reviews FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_var_mod" ON var_reviews FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = var_reviews.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'var_moderator'))
  );
CREATE POLICY "update_var_mod" ON var_reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = var_reviews.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'var_moderator'))
  );

-- 3. voice_commands - restrict to moderator
DROP POLICY IF EXISTS insert_voice_commands_ai ON voice_commands;
DROP POLICY IF EXISTS select_voice_commands_ai ON voice_commands;
CREATE POLICY "select_voice_mod" ON voice_commands FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = voice_commands.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );
CREATE POLICY "insert_voice_mod" ON voice_commands FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = voice_commands.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );

-- 4. websocket_connections - restrict to self
DROP POLICY IF EXISTS insert_ws_connections ON websocket_connections;
DROP POLICY IF EXISTS select_ws_connections ON websocket_connections;
DROP POLICY IF EXISTS update_ws_connections ON websocket_connections;
CREATE POLICY "select_ws_self" ON websocket_connections FOR SELECT
  TO authenticated USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "insert_ws_self" ON websocket_connections FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_ws_self" ON websocket_connections FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- 5. player_achievements - public read, owner write
DROP POLICY IF EXISTS select_player_achievements ON player_achievements;
CREATE POLICY "select_player_achievements_public" ON player_achievements FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_player_achievements_admin" ON player_achievements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 6. player_kits - public read, owner write
DROP POLICY IF EXISTS select_player_kits ON player_kits;
CREATE POLICY "select_player_kits_public" ON player_kits FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_player_kits_team_owner" ON player_kits FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = player_kits.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'team_owner'))
  );
CREATE POLICY "update_player_kits_team_owner" ON player_kits FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = player_kits.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'team_owner'))
  );

-- 7. player_match_stats - restrict to moderator
DROP POLICY IF EXISTS insert_player_match_stats ON player_match_stats;
DROP POLICY IF EXISTS select_player_match_stats ON player_match_stats;
CREATE POLICY "select_player_match_stats_public" ON player_match_stats FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_player_match_stats_mod" ON player_match_stats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = player_match_stats.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'moderator'))
  );

-- 8. tournament_brackets - restrict to league owner
DROP POLICY IF EXISTS insert_tournament_brackets ON tournament_brackets;
DROP POLICY IF EXISTS select_tournament_brackets ON tournament_brackets;
DROP POLICY IF EXISTS update_tournament_brackets ON tournament_brackets;
CREATE POLICY "select_tournament_brackets_public" ON tournament_brackets FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_tournament_brackets_owner" ON tournament_brackets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = tournament_brackets.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );
CREATE POLICY "update_tournament_brackets_owner" ON tournament_brackets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = tournament_brackets.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'league_owner'))
  );

-- 9. standings - public read, league owner write
DROP POLICY IF EXISTS select_standings ON standings;
DROP POLICY IF EXISTS update_standings ON standings;
CREATE POLICY "select_standings_public" ON standings FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "update_standings_owner" ON standings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = standings.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 10. team_league_approvals - restrict to league owner
DROP POLICY IF EXISTS select_team_league_approvals ON team_league_approvals;
CREATE POLICY "select_team_approvals_owner" ON team_league_approvals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM leagues WHERE leagues.id = team_league_approvals.league_id AND leagues.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_league_approvals.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 11. sponsor_ads - admin only (uses status column, not is_active)
DROP POLICY IF EXISTS delete_sponsor_ads ON sponsor_ads;
DROP POLICY IF EXISTS insert_sponsor_ads ON sponsor_ads;
DROP POLICY IF EXISTS select_sponsor_ads ON sponsor_ads;
DROP POLICY IF EXISTS update_sponsor_ads ON sponsor_ads;
CREATE POLICY "select_sponsor_ads_public" ON sponsor_ads FOR SELECT
  TO authenticated USING (status = 'active');
CREATE POLICY "insert_sponsor_ads_admin" ON sponsor_ads FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "update_sponsor_ads_admin" ON sponsor_ads FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );
CREATE POLICY "delete_sponsor_ads_admin" ON sponsor_ads FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- 12. commentator_sessions - fix to use proper ownership
DROP POLICY IF EXISTS select_commentators ON commentator_sessions;
CREATE POLICY "select_commentators_match" ON commentator_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = commentator_sessions.match_id)
  );

-- 13. ball_tracking_exports - match-based access
DROP POLICY IF EXISTS select_ball_exports_ai ON ball_tracking_exports;
CREATE POLICY "select_ball_exports_mod" ON ball_tracking_exports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM match_moderators WHERE match_moderators.match_id = ball_tracking_exports.match_id AND match_moderators.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'var_moderator'))
  );

-- 14. viewer_sessions - user only update
CREATE POLICY "update_viewer_sessions_self" ON viewer_sessions FOR UPDATE
  TO authenticated USING (user_id = auth.uid());
