import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ArrowUpRight, Lock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/lib/store/state';
import { useAuth } from '@/lib/auth';
import { seo } from '@/lib/store/catalog';
import { Empty, OrderSummary } from '@/components/store/pages';
import { MapPicker } from '@/components/store/map-picker';
import { startCheckout, confirmPayment, markPaymentFailed } from '@/lib/checkout.functions';
import { addressSchema } from '@/lib/store/validation';

export const Route = createFileRoute('/_authenticated/checkout')({
  head: () => { const h = seo('Secure Checkout | Youth Fashion Sampla', 'Enter your delivery address and pay securely online.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex' }], links: [{ rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }] }; },
  component: CheckoutPage,
});

type Address = { id: string; full_name: string; phone: string; house: string; street: string; city: string; state: string; pin: string; instructions: string | null; lat: number | null; lng: number | null };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

function loadRazorpay() {
  return new Promise<boolean>(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  });
}

function CheckoutPage() {
  const { cart, products, clearCart } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = useServerFn(startCheckout), confirm = useServerFn(confirmPayment), fail = useServerFn(markPaymentFailed);
  const [saved, setSaved] = useState<Address[]>([]);
  const [form, setForm] = useState({ fullName: '', phone: '', house: '', street: '', city: '', state: 'Haryana', pin: '', instructions: '' });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).then(({ data }) => {
      const list = (data ?? []) as Address[]; setSaved(list); if (list[0]) use(list[0]);
    });
  }, [user]);

  function use(a: Address) {
    setForm({ fullName: a.full_name, phone: a.phone, house: a.house, street: a.street, city: a.city, state: a.state, pin: a.pin, instructions: a.instructions ?? '' });
    setPin(a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null); setSave(false);
  }

  if (!cart.length) return <Empty title="LET’S FIND YOUR FIT" message="Add a product to your bag before checking out." />;

  async function pay(e: FormEvent) {
    e.preventDefault(); setError('');
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check your address'); return; }
    setBusy(true);
    try {
      if (save && user) await supabase.from('addresses').insert({ user_id: user.id, full_name: form.fullName, phone: form.phone, house: form.house, street: form.street, city: form.city, state: form.state, pin: form.pin, instructions: form.instructions || null, lat: pin?.lat ?? null, lng: pin?.lng ?? null, is_default: saved.length === 0 });
      const res = await start({ data: { items: cart.map(l => ({ productId: l.productId, size: l.size, color: l.color, quantity: l.quantity })), address: { ...parsed.data, instructions: form.instructions || undefined, lat: pin?.lat ?? null, lng: pin?.lng ?? null }, ...(user?.email ? { email: user.email } : {}) } });
      if (!res.ok) { setError(res.error); setBusy(false); return; }
      if (!(await loadRazorpay()) || !window.Razorpay) { setError('Could not load the payment window. Check your connection and try again.'); setBusy(false); return; }
      const rz = new window.Razorpay({
        key: res.keyId, amount: res.amount, currency: 'INR', order_id: res.razorpayOrderId, name: 'Youth Fashion Sampla',
        description: 'Order payment', prefill: { name: form.fullName, contact: '+91' + form.phone, email: user?.email ?? '' }, theme: { color: '#111111' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await confirm({ data: { orderId: res.orderId, razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, signature: r.razorpay_signature } });
          setBusy(false);
          if (!v.ok) { setError(v.error); return; }
          clearCart(); navigate({ to: '/orders', search: { placed: res.orderId } });
        },
        modal: { ondismiss: () => { setBusy(false); setError('Payment cancelled. Your bag is saved — you can try again.'); void fail({ data: { orderId: res.orderId } }); } },
      });
      rz.on('payment.failed', () => { setError('Payment failed. No order was placed. Please try again or use another method.'); });
      rz.open();
    } catch { setError('Something went wrong. Please try again.'); setBusy(false); }
  }

  const field = (k: keyof typeof form, label: string, props: Record<string, unknown> = {}, wide = false) =>
    <label className={`text-xs font-medium ${wide ? 'col-span-2' : ''}`}>{label}<input className="mt-2" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} {...props} /></label>;

  return <main className="wrap section">
    <p className="eyebrow text-muted-foreground mb-3">THE FINAL DETAILS</p>
    <h1 className="page-title mb-10">CHECKOUT</h1>
    <div className="grid md:grid-cols-2 gap-12">
      <form onSubmit={pay} className="grid grid-cols-2 gap-5 content-start">
        <h2 className="col-span-2 text-3xl">DELIVERY ADDRESS</h2>
        {saved.length > 0 && <div className="col-span-2 grid gap-2">{saved.map(a => <button type="button" key={a.id} onClick={() => use(a)} className="border p-3 text-left text-xs hover:bg-secondary">{a.full_name} · {a.house}, {a.street}, {a.city} {a.pin}</button>)}</div>}
        {field('fullName', 'Full name', { autoComplete: 'name', required: true }, true)}
        {field('phone', 'Mobile number', { type: 'tel', inputMode: 'numeric', placeholder: '10-digit mobile', autoComplete: 'tel-national', required: true })}
        {field('pin', 'PIN code', { inputMode: 'numeric', placeholder: '6-digit PIN', autoComplete: 'postal-code', required: true })}
        {field('house', 'House / building no.', { required: true }, true)}
        {field('street', 'Street and locality', { autoComplete: 'street-address', required: true }, true)}
        {field('city', 'City', { autoComplete: 'address-level2', required: true })}
        {field('state', 'State', { autoComplete: 'address-level1', required: true })}
        {field('instructions', 'Delivery instructions (optional)', { maxLength: 300 }, true)}
        <div className="col-span-2"><p className="eyebrow mb-3">PIN YOUR LOCATION (OPTIONAL)</p><MapPicker value={pin} onChange={setPin} /></div>
        <label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" className="!w-5 !h-5 accent-primary" checked={save} onChange={e => setSave(e.target.checked)} />Save this address to my account</label>
        <div className="col-span-2 border-t pt-5">
          <p className="eyebrow mb-3">PAYMENT</p>
          <p className="text-xs text-muted-foreground leading-6 flex gap-2"><Lock className="size-4 shrink-0 mt-1" />Pay securely online with UPI (PhonePe, Google Pay and more), cards or net banking via Razorpay. Cash on Delivery is not available.</p>
          {error && <p role="alert" className="text-destructive text-xs mt-4">{error}</p>}
          <Button size="lg" type="submit" className="mt-6 w-full" disabled={busy}>{busy ? 'PROCESSING…' : 'PAY SECURELY'} <ArrowUpRight /></Button>
          <Link to="/cart" className="text-link mt-4">BACK TO BAG</Link>
        </div>
      </form>
      <aside className="bg-secondary p-6 sm:p-8 self-start"><OrderSummary /><div className="mt-7 border-t pt-5 flex gap-3 text-xs leading-6 text-muted-foreground"><Truck className="size-5 shrink-0 mt-1" />All India delivery. Final amount is confirmed securely before payment.</div><p className="text-[10px] text-muted-foreground mt-3">{products.length ? '' : 'Loading prices…'}</p></aside>
    </div>
  </main>;
}
