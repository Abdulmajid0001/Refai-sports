import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Extended roles including VAR-specific roles
export type UserRole =
  | 'super_admin'
  | 'league_owner'
  | 'team_owner'
  | 'coach'
  | 'moderator'
  | 'var_moderator'
  | 'replay_moderator'
  | 'graphics_moderator'
  | 'viewer'
  | 'camera_operator'
  | 'commentator';

export type AccountStatus = 'pending' | 'approved' | 'suspended';

export interface MFADevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'web' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip_address: string;
  last_used: string;
  is_trusted: boolean;
  is_current: boolean;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  device_name: string;
  ip_address: string;
  location: string;
  started_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'blocked';
  details?: string;
  created_at: string;
}

type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: UserRole;
  account_status: AccountStatus;
  avatar_url?: string | null;
  phone?: string | null;
  mfa_enabled: boolean;
  mfa_method?: 'app' | 'sms' | 'email' | null;
  created_at: string;
  updated_at: string | null;
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  league_owner: 80,
  team_owner: 60,
  coach: 50,
  moderator: 40,
  var_moderator: 40,
  replay_moderator: 40,
  graphics_moderator: 40,
  commentator: 20,
  camera_operator: 20,
  viewer: 10,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Track device
      if (session?.user) {
        trackDevice(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        trackDevice(session.user.id);
        logAuditEvent('auth.login', 'session', 'success');
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSessions([]);
        setDevices([]);
        logAuditEvent('auth.logout', 'session', 'success');
      }

      if (event === 'TOKEN_REFRESHED') {
        logAuditEvent('auth.token_refresh', 'session', 'success');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);

          // Check MFA status
          if (data.mfa_enabled) {
            setMfaRequired(true);
          }
        } else {
          // Create profile if missing
          createProfile(user);
        }
      });
  }, [user]);

  // Load sessions and devices
  useEffect(() => {
    if (!user) return;

    loadSessions();
    loadDevices();
    loadRecentAuditLogs();
  }, [user]);

  // Create profile for new users
  const createProfile = async (user: User) => {
    const newProfile = {
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
      email: user.email,
      role: 'viewer' as UserRole,
      account_status: 'approved' as AccountStatus,
      mfa_enabled: false,
    };

    const { error } = await supabase
      .from('profiles')
      .insert(newProfile);

    if (!error) {
      setProfile(newProfile as Profile);
    }
  };

  // Track device
  const trackDevice = async (userId: string) => {
    const ua = navigator.userAgent;
    const deviceInfo = parseUserAgent(ua);

    await supabase.from('user_devices').upsert({
      user_id: userId,
      device_name: `${deviceInfo.browser} on ${deviceInfo.os}`,
      device_type: detectDeviceType(),
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: await fetchIpAddress(),
      last_used: new Date().toISOString(),
      is_current: true,
    }, { onConflict: 'user_id,device_name' });
  };

  // Load sessions
  const loadSessions = async () => {
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .order('last_activity', { ascending: false });

    if (data) {
      setSessions(data as ActiveSession[]);
    }
  };

  // Load devices
  const loadDevices = async () => {
    const { data } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user?.id)
      .order('last_used', { ascending: false });

    if (data) {
      setDevices(data as MFADevice[]);
    }
  };

  // Load recent audit logs
  const loadRecentAuditLogs = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAuditLogs(data as AuditEvent[]);
    }
  };

  // Log audit event
  const logAuditEvent = async (
    action: string,
    resource: string,
    status: 'success' | 'failure' | 'blocked',
    resourceId?: string,
    details?: string
  ) => {
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action,
      resource,
      resource_id: resourceId,
      status,
      details,
      ip_address: await fetchIpAddress(),
      user_agent: navigator.userAgent,
    });
  };

  // Role checking function
  const hasRole = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Super admin has access to everything
    if (profile.role === 'super_admin') return true;

    // Check role hierarchy
    const profileLevel = ROLE_HIERARCHY[profile.role] || 0;
    return roles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      return profileLevel >= requiredLevel;
    });
  }, [profile]);

  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!profile) return false;
    if (profile.role === 'super_admin') return true;

    // Role-based permission checks
    const rolePermissions: Record<UserRole, string[]> = {
      super_admin: ['*'],
      league_owner: ['league.*', 'team.*', 'match.*', 'player.*', 'finance.*', 'settings.*'],
      team_owner: ['team.view', 'team.edit', 'player.*', 'match.view'],
      coach: ['team.view', 'player.view', 'match.view', 'formation.*'],
      moderator: ['match.control', 'events.*', 'graphics.*', 'announcements.*'],
      var_moderator: ['var.*', 'replay.view', 'match.view'],
      replay_moderator: ['replay.*', 'match.view'],
      graphics_moderator: ['graphics.*', 'match.view'],
      commentator: ['commentary.*', 'stats.view', 'match.view'],
      camera_operator: ['camera.*', 'stream.*', 'match.view'],
      viewer: ['match.view', 'stream.view', 'stats.view'],
    };

    const permissions = rolePermissions[profile.role] || [];
    return permissions.some((p) => p === '*' || p === permission ||
      (p.endsWith('.*') && permission.startsWith(p.slice(0, -1))));
  }, [profile]);

  // Revoke session
  const revokeSession = async (sessionId: string) => {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);

    await logAuditEvent('session.revoke', 'session', 'success', sessionId);
    loadSessions();
  };

  // Revoke all other sessions
  const revokeOtherSessions = async () => {
    const currentSessionId = session?.access_token;

    await supabase
      .from('user_sessions')
      .delete()
      .neq('id', currentSessionId || '');

    await logAuditEvent('session.revoke_all', 'session', 'success');
    loadSessions();
  };

  // Trust device
  const trustDevice = async (deviceId: string) => {
    await supabase
      .from('user_devices')
      .update({ is_trusted: true })
      .eq('id', deviceId);

    loadDevices();
  };

  // Remove device
  const removeDevice = async (deviceId: string) => {
    await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);

    await logAuditEvent('device.remove', 'device', 'success', deviceId);
    loadDevices();
  };

  // Enable MFA
  const enableMFA = async (method: 'app' | 'sms' | 'email') => {
    const { error } = await supabase
      .from('profiles')
      .update({
        mfa_enabled: true,
        mfa_method: method
      })
      .eq('id', user?.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, mfa_enabled: true, mfa_method: method } : null);
      await logAuditEvent('mfa.enable', 'security', 'success');
    }

    return !error;
  };

  // Disable MFA
  const disableMFA = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        mfa_enabled: false,
        mfa_method: null
      })
      .eq('id', user?.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, mfa_enabled: false, mfa_method: null } : null);
      await logAuditEvent('mfa.disable', 'security', 'success');
    }

    return !error;
  };

  // Sign out
  const signOut = async () => {
    await logAuditEvent('auth.logout', 'session', 'success');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setSessions([]);
    setDevices([]);
  };

  return {
    user,
    profile,
    session,
    loading,
    sessions,
    devices,
    auditLogs,
    mfaRequired,
    hasRole,
    hasPermission,
    signOut,
    logAuditEvent,
    revokeSession,
    revokeOtherSessions,
    trustDevice,
    removeDevice,
    enableMFA,
    disableMFA,
    setMfaRequired,
  };
}

// Helper functions
function parseUserAgent(ua: string) {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/?\s*(\d+)/i)?.[1] || 'Unknown';
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS)\/?\s*(\d+)?/i)?.[1] || 'Unknown';
  return { browser, os };
}

function detectDeviceType(): 'web' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'web';
}

async function fetchIpAddress(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}
