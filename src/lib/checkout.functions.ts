import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  house: z.string().trim().min(1).max(120),
  street: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pin: z.string().regex(/^[1-9]\d{5}$/),
  instructions: z.string().trim().max(300).optional(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
});
const checkoutInput = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), size: z.string().max(40), color: z.string().max(40), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  address: addressSchema,
  email: z.string().email().max(255).optional(),
});

type Fail = { ok: false; error: string };

// Validates cart against live prices/stock, saves a pending order, then creates the Razorpay order.
export const startCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutInput.parse(d))
  .handler(async ({ data, context }): Promise<Fail | { ok: true; orderId: string; razorpayOrderId: string; amount: number; keyId: string }> => {
    const { razorpayKeys, createRazorpayOrder } = await import('./razorpay.server');
    const keys = razorpayKeys();
    if (!keys) return { ok: false, error: 'Online payments are not set up yet. Please try again later or contact the store.' };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const ids = [...new Set(data.items.map(i => i.productId))];
    const { data: products, error } = await supabaseAdmin.from('products').select('id,name,price,discount_price,images,active,product_variants(id,size,color,sku,stock)').in('id', ids);
    if (error || !products) return { ok: false, error: 'Could not check your cart. Please try again.' };
    const lines = [];
    let subtotal = 0, original = 0;
    for (const item of data.items) {
      const p = products.find(x => x.id === item.productId);
      if (!p || !p.active) return { ok: false, error: 'An item in your bag is no longer available.' };
      const v = p.product_variants.find(x => x.size === item.size && x.color === item.color);
      if (!v) return { ok: false, error: `${p.name} (${item.size}/${item.color}) is no longer available.` };
      if (v.stock < item.quantity) return { ok: false, error: `Only ${v.stock} left of ${p.name} (${item.size}/${item.color}).` };
      const unit = p.discount_price ?? p.price;
      subtotal += unit * item.quantity; original += p.price * item.quantity;
      lines.push({ product_id: p.id, variant_id: v.id, name: p.name, image: p.images[0] ?? null, size: v.size, color: v.color, sku: v.sku, unit_price: unit, original_price: p.price, quantity: item.quantity });
    }
    const a = data.address;
    const { data: order, error: oErr } = await supabaseAdmin.from('orders').insert({
      user_id: context.userId, subtotal: original, discount_total: original - subtotal, total: subtotal,
      customer_name: a.fullName, customer_phone: a.phone, customer_email: data.email ?? null,
      address: { house: a.house, street: a.street, city: a.city, state: a.state, pin: a.pin, instructions: a.instructions ?? '' },
      lat: a.lat, lng: a.lng,
    }).select('id, order_number').single();
    if (oErr || !order) return { ok: false, error: 'Could not create your order. Please try again.' };
    const { error: iErr } = await supabaseAdmin.from('order_items').insert(lines.map(l => ({ ...l, order_id: order.id })));
    if (iErr) { await supabaseAdmin.from('orders').delete().eq('id', order.id); return { ok: false, error: 'Could not create your order. Please try again.' }; }
    try {
      const rz = await createRazorpayOrder(subtotal, `YF-${order.order_number}`);
      await supabaseAdmin.from('orders').update({ razorpay_order_id: rz.id }).eq('id', order.id);
      return { ok: true, orderId: order.id, razorpayOrderId: rz.id, amount: rz.amount, keyId: keys.keyId };
    } catch {
      await supabaseAdmin.from('orders').update({ status: 'payment_failed', payment_status: 'failed', note: 'Gateway order creation failed' }).eq('id', order.id);
      return { ok: false, error: 'The payment gateway is unavailable. Please try again shortly.' };
    }
  });

// Verifies the Razorpay signature on the server before marking an order paid.
export const confirmPayment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), razorpayOrderId: z.string().max(100), razorpayPaymentId: z.string().max(100), signature: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }): Promise<Fail | { ok: true; status: string }> => {
    const { razorpayKeys, hmacHex, safeEqual } = await import('./razorpay.server');
    const keys = razorpayKeys();
    if (!keys) return { ok: false, error: 'Payments are not configured.' };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: order } = await supabaseAdmin.from('orders').select('id,user_id,razorpay_order_id').eq('id', data.orderId).maybeSingle();
    if (!order || order.user_id !== context.userId || order.razorpay_order_id !== data.razorpayOrderId) return { ok: false, error: 'Order not found.' };
    const expected = await hmacHex(keys.keySecret, `${data.razorpayOrderId}|${data.razorpayPaymentId}`);
    if (!safeEqual(expected, data.signature)) return { ok: false, error: 'Payment could not be verified. If money was deducted, it will be confirmed automatically or refunded.' };
    const { data: result, error } = await supabaseAdmin.rpc('finalize_paid_order', { _order_id: order.id, _payment_id: data.razorpayPaymentId });
    if (error) return { ok: false, error: 'Payment received but order update failed. The store will contact you.' };
    return { ok: true, status: String(result) };
  });

// Records a cancelled/failed attempt for an unpaid order (never overrides a paid order).
export const markPaymentFailed = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('orders').update({ status: 'payment_failed', payment_status: 'failed' }).eq('id', data.orderId).eq('user_id', context.userId).eq('payment_status', 'created');
    return { ok: true };
  });
