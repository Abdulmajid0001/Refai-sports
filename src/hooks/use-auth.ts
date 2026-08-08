import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AccountStatus, UserRole } from '@/lib/roles';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  account_status: AccountStatus;
  mfa_enabled: boolean;
  created_at: string;
  last_login: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    setProfile((data as Profile | null) ?? null);
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = useMemo(() => (required: UserRole | UserRole[]) => {
    if (!profile) return false;
    if (profile.role === 'super_admin') return true;
    const roles = Array.isArray(required) ? required : [required];
    return roles.includes(profile.role);
  }, [profile]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return { user, profile, loading, hasRole, isApproved: profile?.account_status === 'approved', reloadProfile: loadProfile, signOut };
}
