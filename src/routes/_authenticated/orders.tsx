import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { money, seo } from '@/lib/store/catalog';

export const Route = createFileRoute('/_authenticated/orders')({
  validateSearch: (s: Record<string, unknown>): { placed?: string | undefined } => ({ placed: typeof s['placed'] === 'string' ? s['placed'] : undefined }),
  head: () => { const h = seo('My Orders | Youth Fashion Sampla', 'View your Youth Fashion Sampla order history and status.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex' }] }; },
  component: OrdersPage,
});

type Order = { id: string; order_number: number; status: string; payment_status: string; total: number; created_at: string; order_items: { name: string; size: string; color: string; quantity: number; unit_price: number }[] };

function OrdersPage() {
  const { placed } = Route.useSearch();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { supabase.from('orders').select('id,order_number,status,payment_status,total,created_at,order_items(name,size,color,quantity,unit_price)').order('created_at', { ascending: false }).then(({ data }) => setOrders((data ?? []) as Order[])); }, []);
  return <main className="wrap section max-w-3xl">
    <h1 className="page-title mb-8">MY ORDERS</h1>
    {placed && <p role="status" className="bg-secondary p-5 mb-8 text-sm">Payment verified — your order is confirmed. Thank you!</p>}
    {orders === null ? <p className="text-xs text-muted-foreground">Loading…</p> : orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> :
      <div className="divide-y border-y">{orders.map(o => <div key={o.id} className="py-5">
        <div className="flex justify-between text-sm font-semibold"><span>Order #{o.order_number}</span><span>{money(o.total)}</span></div>
        <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString('en-IN')} · {o.status.replace('_', ' ')} · payment {o.payment_status}</p>
        <ul className="text-xs mt-3 grid gap-1">{o.order_items.map((i, n) => <li key={n}>{i.name} — {i.size}/{i.color} × {i.quantity} · {money(i.unit_price * i.quantity)}</li>)}</ul>
      </div>)}</div>}
  </main>;
}
