import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { seo } from '@/lib/store/catalog';

export const Route = createFileRoute('/reset-password')({
  head: () => { const h = seo('Set a New Password | Youth Fashion Sampla', 'Choose a new password for your Youth Fashion Sampla account.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex' }] }; },
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    navigate({ to: '/account' });
  }
  return (
    <main className="wrap section max-w-md">
      <h1 className="page-title mb-8">NEW PASSWORD</h1>
      <form onSubmit={submit} className="grid gap-4">
        <label className="text-xs">New password<input className="mt-2" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <Button type="submit" size="lg" disabled={busy}>UPDATE PASSWORD</Button>
      </form>
    </main>
  );
}
