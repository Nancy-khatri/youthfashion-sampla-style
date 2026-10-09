import { createFileRoute, Link } from '@tanstack/react-router';
import { AdminPage } from '@/components/store/admin';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { seo } from '@/lib/store/catalog';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => { const h = seo('Store Admin | Youth Fashion Sampla', 'Private store management for Youth Fashion Sampla.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex,nofollow' }] }; },
  component: AdminGate,
});

function AdminGate() {
  const { loading, isStaff } = useAuth();
  if (loading) return <main className="wrap section text-xs text-muted-foreground">Checking access…</main>;
  if (!isStaff) return <main className="wrap section max-w-md"><h1 className="page-title mb-4">NO ACCESS</h1><p className="text-sm text-muted-foreground mb-6">This area is only for the shop owner and staff.</p><Button asChild><Link to="/account">GO TO MY ACCOUNT</Link></Button></main>;
  return <AdminPage />;
}
