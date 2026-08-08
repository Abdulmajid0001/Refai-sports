export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          role: UserRole;
          account_status: 'pending' | 'approved' | 'suspended';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          account_status?: 'pending' | 'approved' | 'suspended';
        };
        Update: {
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          account_status?: 'pending' | 'approved' | 'suspended';
        };
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          format: LeagueFormat;
          is_suspended: boolean;
          suspended_reason: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          format?: LeagueFormat;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          format?: LeagueFormat;
          is_suspended?: boolean;
          suspended_reason?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string | null;
          league_id: string | null;
          is_suspended: boolean;
          suspended_reason: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string | null;
          league_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          league_id?: string | null;
          is_suspended?: boolean;
          suspended_reason?: string | null;
        };
      };
      matches: {
        Row: {
          id: string;
          home_team_id: string;
          away_team_id: string;
          home_score: number;
          away_score: number;
          status: MatchStatus;
          kickoff_at: string | null;
          venue: string | null;
          league_id: string | null;
          current_minute: number | null;
          matchday: number | null;
          created_at: string;
        };
        Insert: {
          home_team_id: string;
          away_team_id: string;
          home_score?: number;
          away_score?: number;
          status?: MatchStatus;
          kickoff_at?: string | null;
          venue?: string | null;
          league_id?: string | null;
        };
        Update: {
          home_score?: number;
          away_score?: number;
          status?: MatchStatus;
          kickoff_at?: string | null;
          current_minute?: number | null;
        };
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          type: MatchEventType;
          team_id: string | null;
          minute: number | null;
          extra_minute: number | null;
          detail: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          match_id: string;
          type: MatchEventType;
          team_id?: string | null;
          minute?: number | null;
          extra_minute?: number | null;
          detail?: string | null;
          created_by?: string | null;
        };
        Update: {
          type?: MatchEventType;
          team_id?: string | null;
          minute?: number | null;
          extra_minute?: number | null;
          detail?: string | null;
        };
      };
      match_highlights: {
        Row: {
          id: string;
          match_id: string;
          title: string;
          minute: number | null;
          start_seconds: number | null;
          end_seconds: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          match_id: string;
          title: string;
          minute?: number | null;
          start_seconds?: number | null;
          end_seconds?: number | null;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          minute?: number | null;
          start_seconds?: number | null;
          end_seconds?: number | null;
        };
      };
      user_follows: {
        Row: {
          id: string;
          user_id: string;
          target_type: 'team' | 'league';
          target_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          target_type: 'team' | 'league';
          target_id: string;
        };
        Update: {};
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          kind: string;
          title: string;
          body?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      ads: {
        Row: {
          id: string;
          name: string;
          image_url: string;
          link_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          image_url: string;
          link_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          image_url?: string;
          link_url?: string | null;
          is_active?: boolean;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          status: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          status: string;
        };
        Update: {
          status?: string;
        };
      };
      var_reviews: {
        Row: {
          id: string;
          match_id: string;
          incident_type: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          confidence: number;
          minute: number | null;
          team_side: 'home' | 'away' | 'neutral';
          description: string | null;
          ai_reasoning: string | null;
          rule_reference: string | null;
          decision: 'confirm' | 'reject' | 'override' | 'escalate' | null;
          decided_by: string | null;
          decided_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          match_id: string;
          incident_type?: string;
          severity?: 'critical' | 'high' | 'medium' | 'low';
          confidence?: number;
          minute?: number | null;
          team_side?: 'home' | 'away' | 'neutral';
          description?: string | null;
          created_by?: string | null;
        };
        Update: {
          decision?: 'confirm' | 'reject' | 'override' | 'escalate' | null;
          decided_by?: string | null;
          decided_at?: string | null;
          notes?: string | null;
        };
      };
      broadcast_state: {
        Row: {
          id: string;
          match_id: string;
          var_screen_mode: 'none' | 'half' | 'full' | 'overlay';
          var_active: boolean;
          var_incident_type: string | null;
          var_confidence: number | null;
          banner_text: string | null;
          banner_active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          match_id: string;
          var_screen_mode?: 'none' | 'half' | 'full' | 'overlay';
          var_active?: boolean;
          updated_by?: string | null;
        };
        Update: {
          var_screen_mode?: 'none' | 'half' | 'full' | 'overlay';
          var_active?: boolean;
          var_incident_type?: string | null;
          var_confidence?: number | null;
          banner_text?: string | null;
          banner_active?: boolean;
          updated_by?: string | null;
        };
      };
      stream_analytics: {
        Row: {
          id: string;
          match_id: string;
          viewer_count: number;
          peak_viewers: number;
          bitrate_kbps: number | null;
          latency_ms: number | null;
          buffering_rate: number | null;
          avg_latency_ms: number | null;
          recorded_at: string;
        };
        Insert: {
          match_id: string;
          viewer_count?: number;
          peak_viewers?: number;
          bitrate_kbps?: number | null;
          latency_ms?: number | null;
        };
        Update: {
          viewer_count?: number;
          peak_viewers?: number;
        };
      };
      player_match_stats: {
        Row: {
          id: string;
          match_id: string;
          team_id: string;
          team_member_id: string | null;
          goals: number;
          assists: number;
          shots: number;
          passes: number;
          tackles: number;
          fouls: number;
          rating: number | null;
        };
        Insert: {
          match_id: string;
          team_id: string;
          team_member_id?: string | null;
          goals?: number;
          assists?: number;
          shots?: number;
          passes?: number;
          tackles?: number;
          fouls?: number;
          rating?: number | null;
        };
        Update: {
          goals?: number;
          assists?: number;
          shots?: number;
          passes?: number;
          tackles?: number;
          fouls?: number;
          rating?: number | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          player_number: number | null;
          player_profiles: { display_name: string } | null;
        };
        Insert: {
          team_id: string;
          player_number?: number | null;
        };
        Update: {
          player_number?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      match_status: MatchStatus;
      match_event_type: MatchEventType;
      league_format: LeagueFormat;
    };
  };
};

export type UserRole =
  | 'super_admin'
  | 'league_owner'
  | 'team_owner'
  | 'coach'
  | 'moderator'
  | 'viewer'
  | 'camera_operator'
  | 'commentator';

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'completed'
  | 'postponed'
  | 'cancelled';

export type MatchEventType =
  | 'goal'
  | 'penalty'
  | 'yellow_card'
  | 'red_card'
  | 'second_yellow'
  | 'foul'
  | 'advantage'
  | 'free_kick'
  | 'corner'
  | 'offside'
  | 'substitution'
  | 'injury'
  | 'var_check'
  | 'var_decision'
  | 'kickoff'
  | 'period_end'
  | 'period_start'
  | 'fulltime'
  | 'note';

export type LeagueFormat = '3' | '4' | '5' | '7' | '8' | '9' | '11';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
