import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { seo } from '@/lib/store/catalog';

export const Route = createFileRoute('/_authenticated/account')({
  head: () => { const h = seo('My Account | Youth Fashion Sampla', 'Manage your Youth Fashion Sampla profile.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex' }] }; },
  component: AccountPage,
});

function AccountPage() {
  const { user, roles, isStaff } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);
  const [ownerExists, setOwnerExists] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle().then(({ data }) => setProfile({ full_name: data?.full_name ?? '', phone: data?.phone ?? '' }));
    supabase.rpc('store_owner_exists').then(({ data }) => setOwnerExists(Boolean(data)));
  }, [user]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get('full_name') ?? '').trim().slice(0, 100);
    const phone = String(f.get('phone') ?? '').trim();
    if (phone && !/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter a valid 10-digit Indian mobile number'); return; }
    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name, phone: phone || null, updated_at: new Date().toISOString() });
    if (error) toast.error('Could not save your profile'); else toast.success('Profile saved');
  }

  async function claim() {
    const { data, error } = await supabase.rpc('claim_store_owner');
    if (error || !data) { toast.error('An owner account already exists.'); setOwnerExists(true); return; }
    toast.success('You are now the store owner.');
    window.location.reload();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: '/auth', search: {}, replace: true });
  }

  return (
    <main className="wrap section max-w-xl">
      <p className="eyebrow text-muted-foreground mb-3">YOUTH FASHION / ACCOUNT</p>
      <h1 className="page-title mb-3">MY ACCOUNT</h1>
      <p className="text-xs text-muted-foreground mb-8">{user?.email} · {roles.join(', ') || 'customer'}</p>
      {profile && <form onSubmit={save} className="grid gap-4 mb-10">
        <label className="text-xs">Full name<input className="mt-2" name="full_name" defaultValue={profile.full_name} maxLength={100} /></label>
        <label className="text-xs">Mobile number<input className="mt-2" name="phone" inputMode="numeric" defaultValue={profile.phone} placeholder="10-digit mobile" /></label>
        <Button type="submit">SAVE PROFILE</Button>
      </form>}
      {isStaff && <Button asChild variant="outline" className="w-full mb-4"><Link to="/admin">OPEN STORE ADMIN</Link></Button>}
      {!ownerExists && <div className="border p-5 mb-6"><p className="text-sm font-semibold mb-2">Set up the store owner</p><p className="text-xs text-muted-foreground mb-4 leading-6">No owner account exists yet. The first person to claim becomes the owner — only the shop owner should press this.</p><Button onClick={claim}>CLAIM OWNER ACCESS</Button></div>}
      <Button variant="ghost" onClick={signOut}>SIGN OUT</Button>
    </main>
  );
}
