import { createFileRoute } from '@tanstack/react-router';

// Razorpay webhook: verifies X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET, deduplicates by event id.
export const Route = createFileRoute('/api/public/razorpay-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
        if (!secret) return new Response('Not configured', { status: 503 });
        const raw = await request.text();
        const sig = request.headers.get('x-razorpay-signature') ?? '';
        const { hmacHex, safeEqual } = await import('@/lib/razorpay.server');
        if (!safeEqual(await hmacHex(secret, raw), sig)) return new Response('Invalid signature', { status: 401 });
        const eventId = request.headers.get('x-razorpay-event-id') ?? '';
        let body: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
        try { body = JSON.parse(raw); } catch { return new Response('Bad request', { status: 400 }); }
        const payment = body.payload?.payment?.entity;
        const rzOrderId = payment?.order_id;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        if (eventId) {
          const { error } = await supabaseAdmin.from('payment_events').insert({ event_id: eventId, event_type: body.event ?? 'unknown', razorpay_order_id: rzOrderId ?? null, payload: body as never });
          if (error?.code === '23505') return new Response('Duplicate', { status: 200 });
        }
        if (!rzOrderId || !payment?.id) return new Response('Ignored', { status: 200 });
        const { data: order } = await supabaseAdmin.from('orders').select('id,payment_status').eq('razorpay_order_id', rzOrderId).maybeSingle();
        if (!order) return new Response('Unknown order', { status: 200 });
        if (body.event === 'payment.captured' || body.event === 'order.paid') {
          await supabaseAdmin.rpc('finalize_paid_order', { _order_id: order.id, _payment_id: payment.id });
        } else if (body.event === 'payment.failed' && order.payment_status === 'created') {
          await supabaseAdmin.from('orders').update({ status: 'payment_failed', payment_status: 'failed' }).eq('id', order.id).eq('payment_status', 'created');
        }
        return new Response('OK', { status: 200 });
      },
    },
  },
});
