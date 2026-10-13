// Pure helpers for the owner dashboard (kept separate so they can be unit tested).
import type { Variant } from './types';

export const parseList = (s: string) => [...new Set(s.split(',').map(x => x.trim()).filter(Boolean))];

export type DraftVariant = { id?: string | undefined; size: string; color: string; sku: string; stock: number };

const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6);

/** One row per size × colour, keeping stock/SKU/id of rows that already existed. */
export function buildVariants(sizes: string[], colors: string[], existing: DraftVariant[], baseSku: string): DraftVariant[] {
  const out: DraftVariant[] = [];
  for (const color of colors) for (const size of sizes) {
    const old = existing.find(v => v.size === size && v.color === color);
    out.push(old ?? { size, color, stock: 0, sku: `${baseSku || 'YF'}-${slug(color)}-${slug(size)}` });
  }
  return out;
}

export function validateProductDraft(d: { name: string; price: number; discountPrice?: number | undefined; category: string; variants: DraftVariant[] }): string | null {
  if (!d.name.trim()) return 'Add a product name.';
  if (!d.category) return 'Choose a category.';
  if (!Number.isInteger(d.price) || d.price <= 0) return 'Price must be a whole number above ₹0.';
  if (d.discountPrice !== undefined && (!Number.isInteger(d.discountPrice) || d.discountPrice <= 0 || d.discountPrice >= d.price)) return 'Discount price must be lower than the regular price.';
  if (!d.variants.length) return 'Add at least one size and one colour.';
  if (d.variants.some(v => !Number.isInteger(v.stock) || v.stock < 0)) return 'Stock cannot be negative.';
  const skus = d.variants.map(v => v.sku.trim());
  if (skus.some(s => !s)) return 'Every size/colour needs a SKU.';
  if (new Set(skus).size !== skus.length) return 'Each size/colour needs a different SKU.';
  return null;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed' | 'needs_attention';
const FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'], payment_failed: ['cancelled'],
  paid: ['processing', 'shipped', 'cancelled', 'needs_attention'],
  needs_attention: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled', 'needs_attention'],
  shipped: ['delivered', 'needs_attention'],
  delivered: [], cancelled: [],
};
/** Statuses staff may move an order to. Unpaid orders can only be cancelled. */
export const nextStatuses = (s: OrderStatus) => FLOW[s];

export const toDraft = (v: Variant): DraftVariant => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock });
