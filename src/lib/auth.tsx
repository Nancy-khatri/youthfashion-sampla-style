import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type Role = 'owner' | 'staff' | 'customer';

// Reflects the signed-in user and their roles. Roles come from the protected
// user_roles table (readable only for your own rows); the database enforces access.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load(u: User | null) {
      if (!active) return;
      setUser(u);
      if (u) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', u.id);
        if (active) setRoles((data ?? []).map(r => r.role as Role));
      } else setRoles([]);
      if (active) setLoading(false);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { void load(session?.user ?? null); });
    supabase.auth.getUser().then(({ data }) => load(data.user));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  const isStaff = roles.includes('owner') || roles.includes('staff');
  return { user, roles, loading, isOwner: roles.includes('owner'), isStaff };
}

export function safeRedirect(path: unknown) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/account';
}
