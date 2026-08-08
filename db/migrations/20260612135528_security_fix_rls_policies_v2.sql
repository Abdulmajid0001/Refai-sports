-- =============================================================
-- Security Fix: Enable RLS on subscription_plans
-- =============================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_subscription_plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_subscription_plans" ON public.subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin')));

CREATE POLICY "update_subscription_plans" ON public.subscription_plans
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin')));

CREATE POLICY "delete_subscription_plans" ON public.subscription_plans
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin')));

-- =============================================================
-- Security Fix: Replace USING(true) on all VAR system tables
-- Role mapping: super_admin = admin, match_admin = moderator, 
-- league_owner can manage own leagues, commentator can insert comms
-- =============================================================

-- Helper function to check admin-level roles
CREATE OR REPLACE FUNCTION public.is_admin_or_match_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'match_admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_match_admin_or_referee()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'match_admin', 'league_owner'));
$$;

-- =============================================================
-- var_reviews
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'var_reviews' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.var_reviews', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_var_reviews" ON public.var_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_var_reviews" ON public.var_reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin_or_referee());

CREATE POLICY "update_var_reviews" ON public.var_reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_var_reviews" ON public.var_reviews
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- broadcast_state
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'broadcast_state' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.broadcast_state', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_broadcast_state" ON public.broadcast_state
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_broadcast_state" ON public.broadcast_state
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "update_broadcast_state" ON public.broadcast_state
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_broadcast_state" ON public.broadcast_state
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- broadcast_states (if exists)
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broadcast_states') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'broadcast_states' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.broadcast_states', pol.policyname);
    END LOOP;

    CREATE POLICY "select_broadcast_states" ON public.broadcast_states
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_broadcast_states" ON public.broadcast_states
      FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_match_admin());
    CREATE POLICY "update_broadcast_states" ON public.broadcast_states
      FOR UPDATE TO authenticated USING (public.is_admin_or_match_admin()) WITH CHECK (public.is_admin_or_match_admin());
    CREATE POLICY "delete_broadcast_states" ON public.broadcast_states
      FOR DELETE TO authenticated USING (public.is_admin_or_match_admin());
  END IF;
END $$;

-- =============================================================
-- comm_messages
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comm_messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.comm_messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_comm_messages" ON public.comm_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_comm_messages" ON public.comm_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'match_admin', 'league_owner', 'commentator')));

CREATE POLICY "update_comm_messages" ON public.comm_messages
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_comm_messages" ON public.comm_messages
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- match_annotations
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_annotations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.match_annotations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_match_annotations" ON public.match_annotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_match_annotations" ON public.match_annotations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "update_match_annotations" ON public.match_annotations
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_match_annotations" ON public.match_annotations
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- match_reports
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_reports' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.match_reports', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_match_reports" ON public.match_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_match_reports" ON public.match_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin_or_referee());

CREATE POLICY "update_match_reports" ON public.match_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_match_reports" ON public.match_reports
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- moderator_actions
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moderator_actions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.moderator_actions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_moderator_actions" ON public.moderator_actions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_moderator_actions" ON public.moderator_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "update_moderator_actions" ON public.moderator_actions
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_moderator_actions" ON public.moderator_actions
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- replay_3d_state
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'replay_3d_state' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.replay_3d_state', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_replay_3d_state" ON public.replay_3d_state
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_replay_3d_state" ON public.replay_3d_state
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "update_replay_3d_state" ON public.replay_3d_state
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_replay_3d_state" ON public.replay_3d_state
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- stream_analytics
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stream_analytics' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.stream_analytics', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_stream_analytics" ON public.stream_analytics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_stream_analytics" ON public.stream_analytics
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "update_stream_analytics" ON public.stream_analytics
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_match_admin())
  WITH CHECK (public.is_admin_or_match_admin());

CREATE POLICY "delete_stream_analytics" ON public.stream_analytics
  FOR DELETE TO authenticated
  USING (public.is_admin_or_match_admin());

-- =============================================================
-- var_incidents
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'var_incidents') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'var_incidents' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.var_incidents', pol.policyname);
    END LOOP;

    CREATE POLICY "select_var_incidents" ON public.var_incidents
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_var_incidents" ON public.var_incidents
      FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_match_admin_or_referee());
    CREATE POLICY "update_var_incidents" ON public.var_incidents
      FOR UPDATE TO authenticated USING (public.is_admin_or_match_admin()) WITH CHECK (public.is_admin_or_match_admin());
    CREATE POLICY "delete_var_incidents" ON public.var_incidents
      FOR DELETE TO authenticated USING (public.is_admin_or_match_admin());
  END IF;
END $$;

-- =============================================================
-- var_reconstruction_frames
-- =============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'var_reconstruction_frames') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'var_reconstruction_frames' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.var_reconstruction_frames', pol.policyname);
    END LOOP;

    CREATE POLICY "select_var_reconstruction_frames" ON public.var_reconstruction_frames
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "insert_var_reconstruction_frames" ON public.var_reconstruction_frames
      FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_match_admin());
    CREATE POLICY "update_var_reconstruction_frames" ON public.var_reconstruction_frames
      FOR UPDATE TO authenticated USING (public.is_admin_or_match_admin()) WITH CHECK (public.is_admin_or_match_admin());
    CREATE POLICY "delete_var_reconstruction_frames" ON public.var_reconstruction_frames
      FOR DELETE TO authenticated USING (public.is_admin_or_match_admin());
  END IF;
END $$;
