// Server-only Razorpay helpers. Secrets are read from server environment at call time.
const enc = new TextEncoder();

export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function razorpayKeys() {
  const keyId = process.env['RAZORPAY_KEY_ID'];
  const keySecret = process.env['RAZORPAY_KEY_SECRET'];
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const keys = razorpayKeys();
  if (!keys) throw new Error('PAYMENTS_NOT_CONFIGURED');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${keys.keyId}:${keys.keySecret}`) },
    body: JSON.stringify({ amount: amountRupees * 100, currency: 'INR', receipt }),
  });
  if (!res.ok) { console.error('Razorpay order failed', res.status, await res.text()); throw new Error('PAYMENT_GATEWAY_ERROR'); }
  return (await res.json()) as { id: string; amount: number };
}
