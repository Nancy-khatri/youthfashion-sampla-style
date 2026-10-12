import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { seo } from '@/lib/store/catalog';
import { safeRedirect } from '@/lib/auth';

export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>) : { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' ? s['redirect'] : undefined }),
  head: () => {
    const h = seo('Sign In or Create Account | Youth Fashion Sampla', 'Sign in to your Youth Fashion Sampla account to manage your profile and orders.');
    return { meta: [...h.meta, { name: 'robots', content: 'noindex' }] };
  },
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email('Enter a valid email').max(255), password: z.string().min(8, 'Password must be at least 8 characters').max(72) });

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safeRedirect(redirect);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: target, replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === 'SIGNED_IN') navigate({ to: target, replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        if (!z.string().email().safeParse(email).success) { toast.error('Enter a valid email'); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent('If an account exists, a password reset link is on its way.');
        return;
      }
      const parsed = schema.safeParse({ email, password: f.get('password') });
      if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Check your details'); return; }
      if (mode === 'up') {
        const fullName = String(f.get('fullName') ?? '').trim().slice(0, 100);
        const { data, error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: window.location.origin + target, data: { full_name: fullName } } });
        if (error) throw error;
        if (!data.session) setSent('Check your email and click the confirmation link to finish creating your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setBusy(false); }
  }

  async function google() {
    sessionStorage.setItem('postAuthRedirect', target);
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/auth' });
    if (r.error) toast.error('Google sign-in failed. Please try again.');
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('postAuthRedirect');
    if (saved) supabase.auth.getUser().then(({ data }) => { if (data.user) { sessionStorage.removeItem('postAuthRedirect'); navigate({ to: safeRedirect(saved), replace: true }); } });
  }, [navigate]);

  return (
    <main className="wrap section max-w-md">
      <p className="eyebrow text-muted-foreground mb-3">YOUTH FASHION / ACCOUNT</p>
      <h1 className="page-title mb-8">{mode === 'up' ? 'CREATE ACCOUNT' : mode === 'forgot' ? 'RESET PASSWORD' : 'SIGN IN'}</h1>
      {sent ? <p className="border p-5 text-sm leading-6">{sent}</p> : <>
        <form onSubmit={submit} className="grid gap-4">
          {mode === 'up' && <label className="text-xs">Full name<input className="mt-2" name="fullName" autoComplete="name" maxLength={100} /></label>}
          <label className="text-xs">Email<input className="mt-2" name="email" type="email" autoComplete="email" required /></label>
          {mode !== 'forgot' && <label className="text-xs">Password<input className="mt-2" name="password" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} minLength={8} required /></label>}
          <Button type="submit" size="lg" disabled={busy}>{mode === 'up' ? 'CREATE ACCOUNT' : mode === 'forgot' ? 'SEND RESET LINK' : 'SIGN IN'}</Button>
        </form>
        {mode !== 'forgot' && <><div className="my-6 text-center text-[10px] text-muted-foreground">OR</div><Button variant="outline" size="lg" className="w-full" onClick={google}>CONTINUE WITH GOOGLE</Button></>}
      </>}
      <div className="mt-8 grid gap-3 text-xs">
        {mode !== 'in' && <button className="text-left underline" onClick={() => { setMode('in'); setSent(''); }}>Already have an account? Sign in</button>}
        {mode !== 'up' && <button className="text-left underline" onClick={() => { setMode('up'); setSent(''); }}>New here? Create an account</button>}
        {mode === 'in' && <button className="text-left underline" onClick={() => setMode('forgot')}>Forgot your password?</button>}
      </div>
    </main>
  );
}
