-- VAR Reviews table
CREATE TABLE IF NOT EXISTS public.var_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  incident_type text NOT NULL DEFAULT 'manual',
  severity text DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  confidence smallint DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  minute smallint,
  team_side text DEFAULT 'neutral' CHECK (team_side IN ('home','away','neutral')),
  description text,
  ai_reasoning text,
  rule_reference text,
  decision text CHECK (decision IN ('confirm','reject','override','escalate')),
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Broadcast State table
CREATE TABLE IF NOT EXISTS public.broadcast_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'none' CHECK (mode IN ('none','half','full','overlay')),
  var_active boolean DEFAULT false,
  var_incident_type text,
  var_confidence smallint,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(match_id)
);

-- Communication Messages table
CREATE TABLE IF NOT EXISTS public.comm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'referee' CHECK (channel IN ('referee','production','commentators','assistant_var')),
  sender_role text NOT NULL DEFAULT 'system',
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Match Annotations table (for stats, metadata, etc.)
CREATE TABLE IF NOT EXISTS public.match_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  annotation_type text NOT NULL DEFAULT 'note',
  data jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 3D Replay State table
CREATE TABLE IF NOT EXISTS public.replay_3d_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.var_reviews(id) ON DELETE SET NULL,
  camera_angle smallint DEFAULT 0,
  is_3d boolean DEFAULT false,
  is_paused boolean DEFAULT false,
  playback_speed numeric DEFAULT 1,
  offside_line_visible boolean DEFAULT false,
  trajectories_visible boolean DEFAULT false,
  skeletons_visible boolean DEFAULT false,
  collisions_visible boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(match_id)
);

-- Moderator Actions log
CREATE TABLE IF NOT EXISTS public.moderator_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  detail jsonb DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now()
);

-- Stream Analytics table
CREATE TABLE IF NOT EXISTS public.stream_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  viewer_count integer DEFAULT 0,
  peak_viewers integer DEFAULT 0,
  bitrate_kbps integer,
  latency_ms integer,
  recorded_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.var_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_3d_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for var_reviews
CREATE POLICY "select_var_reviews" ON public.var_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_var_reviews" ON public.var_reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_var_reviews" ON public.var_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_var_reviews" ON public.var_reviews FOR DELETE TO authenticated USING (true);

-- RLS Policies for broadcast_state
CREATE POLICY "select_broadcast_state" ON public.broadcast_state FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_broadcast_state" ON public.broadcast_state FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_broadcast_state" ON public.broadcast_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_broadcast_state" ON public.broadcast_state FOR DELETE TO authenticated USING (true);

-- RLS Policies for comm_messages
CREATE POLICY "select_comm_messages" ON public.comm_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_comm_messages" ON public.comm_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_comm_messages" ON public.comm_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_comm_messages" ON public.comm_messages FOR DELETE TO authenticated USING (true);

-- RLS Policies for match_annotations
CREATE POLICY "select_match_annotations" ON public.match_annotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_match_annotations" ON public.match_annotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_match_annotations" ON public.match_annotations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_match_annotations" ON public.match_annotations FOR DELETE TO authenticated USING (true);

-- RLS Policies for replay_3d_state
CREATE POLICY "select_replay_3d_state" ON public.replay_3d_state FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_replay_3d_state" ON public.replay_3d_state FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_replay_3d_state" ON public.replay_3d_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_replay_3d_state" ON public.replay_3d_state FOR DELETE TO authenticated USING (true);

-- RLS Policies for moderator_actions
CREATE POLICY "select_moderator_actions" ON public.moderator_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_moderator_actions" ON public.moderator_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_moderator_actions" ON public.moderator_actions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_moderator_actions" ON public.moderator_actions FOR DELETE TO authenticated USING (true);

-- RLS Policies for stream_analytics
CREATE POLICY "select_stream_analytics" ON public.stream_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_stream_analytics" ON public.stream_analytics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_stream_analytics" ON public.stream_analytics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_stream_analytics" ON public.stream_analytics FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_var_reviews_match ON public.var_reviews(match_id);
CREATE INDEX IF NOT EXISTS idx_comm_messages_match ON public.comm_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_match ON public.moderator_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_match ON public.stream_analytics(match_id);
CREATE INDEX IF NOT EXISTS idx_match_annotations_match ON public.match_annotations(match_id);
