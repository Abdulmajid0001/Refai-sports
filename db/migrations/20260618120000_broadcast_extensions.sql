-- Migration for Broadcast Extensions (Modules 10-13)
-- BGE Templates, Replay Engine, Announcements, Formations

-- 1. BGE Templates table
CREATE TABLE IF NOT EXISTS public.bge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text,
  default_display_mode text NOT NULL DEFAULT 'popup',
  default_animation text NOT NULL DEFAULT 'fade',
  default_dismiss_ms integer DEFAULT 5000,
  thumbnail_url text,
  is_enabled boolean DEFAULT true,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category, name, league_id)
);

-- 2. Replay Clips table
CREATE TABLE IF NOT EXISTS public.replay_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  start_time_seconds integer NOT NULL,
  end_time_seconds integer NOT NULL,
  label text,
  tags text[] DEFAULT '{}',
  camera_angle text DEFAULT 'main',
  trigger_type text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_replay_clips_match ON public.replay_clips(match_id);

-- 3. Replay Queue table
CREATE TABLE IF NOT EXISTS public.replay_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  clip_ids uuid[] NOT NULL DEFAULT '{}',
  current_index integer DEFAULT 0,
  status text DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_replay_queue_match ON public.replay_queue(match_id);

-- 4. Moderator Announcements table
CREATE TABLE IF NOT EXISTS public.moderator_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  announcement_type text NOT NULL,
  headline text NOT NULL,
  message text,
  display_mode text NOT NULL DEFAULT 'banner',
  priority text DEFAULT 'normal',
  audio_alert_type text,
  auto_dismiss_ms integer,
  is_active boolean DEFAULT true,
  pushed_at timestamptz DEFAULT now(),
  dismissed_at timestamptz,
  pushed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_match ON public.moderator_announcements(match_id);

-- 5. Custom Formations table
CREATE TABLE IF NOT EXISTS public.custom_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  format_type text NOT NULL,
  positions jsonb NOT NULL DEFAULT '[]',
  tactical_notes text[] DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_formations_team ON public.custom_formations(team_id);

-- 6. Graphics Events extended
ALTER TABLE public.graphics_events ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.bge_templates(id);
ALTER TABLE public.graphics_events ADD COLUMN IF NOT EXISTS animation text DEFAULT 'fade';
ALTER TABLE public.graphics_events ADD COLUMN IF NOT EXISTS is_dismissed boolean DEFAULT false;

-- RLS Policies
ALTER TABLE public.bge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_bge_templates" ON public.bge_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bge_templates" ON public.bge_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_bge_templates" ON public.bge_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "select_replay_clips" ON public.replay_clips FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_replay_clips" ON public.replay_clips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_replay_clips" ON public.replay_clips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_replay_clips" ON public.replay_clips FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_replay_queue" ON public.replay_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_replay_queue" ON public.replay_queue FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "select_announcements" ON public.moderator_announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_announcements" ON public.moderator_announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_announcements" ON public.moderator_announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "select_formations" ON public.custom_formations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_formations" ON public.custom_formations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_formations" ON public.custom_formations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_formations" ON public.custom_formations FOR DELETE TO authenticated USING (true);

-- 7. League settings for optional features
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_scoreboard_graphic boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_goal_popup boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_card_popup boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_sub_popup boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_var_overlay boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_formation_graphic boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_halftime_stats boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_fulltime_stats boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_replay_graphics boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_sponsor_graphics boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS enable_announcements boolean DEFAULT true;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS replay_transition_type text DEFAULT 'league_logo';
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS replay_sponsor_id uuid;

-- Insert default BGE templates
INSERT INTO public.bge_templates (category, name, description, default_display_mode, default_animation, default_dismiss_ms)
VALUES
  ('goal', 'Modern Goal', 'Clean modern goal popup with gradient', 'center_takeover', 'zoom', 5000),
  ('goal', 'Classic Goal', 'Traditional goal announcement', 'popup', 'fade', 5000),
  ('card', 'Standard Card', 'Standard card announcement', 'popup', 'fade', 4000),
  ('var', 'VAR Check', 'Standard VAR check overlay', 'center_takeover', 'fade', 0),
  ('scoreboard', 'Modern Scoreboard', 'Modern gradient scoreboard', 'top_banner', 'fade', 0),
  ('announcement', 'Banner Alert', 'Standard announcement banner', 'bottom_banner', 'slide_up', 5000)
ON CONFLICT DO NOTHING;
