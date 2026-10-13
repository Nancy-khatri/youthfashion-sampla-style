import { supabase } from '@/integrations/supabase/client';
import type { Product, Variant } from './types';

type Row = {
  id: string; name: string; description: string; category: string; subcategory: string | null; brand: string;
  price: number; discount_price: number | null; images: string[]; tags: string[]; featured: boolean; new_arrival: boolean;
  active: boolean; low_stock_threshold: number; created_at: string; updated_at: string;
  product_variants: { id: string; size: string; color: string; sku: string; stock: number }[];
};

export function mapProduct(r: Row): Product {
  const variants: Variant[] = (r.product_variants ?? []).map(v => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock }));
  return {
    id: r.id, name: r.name, description: r.description, category: r.category, subcategory: r.subcategory ?? undefined,
    brand: r.brand, price: r.price, discountPrice: r.discount_price ?? undefined, images: r.images ?? [], tags: r.tags ?? [],
    featured: r.featured, newArrival: r.new_arrival, active: r.active, lowStockThreshold: r.low_stock_threshold,
    createdAt: r.created_at, updatedAt: r.updated_at, isDemo: false, variants,
    sizes: [...new Set(variants.map(v => v.size))], colors: [...new Set(variants.map(v => v.color))],
    stock: variants.reduce((n, v) => n + v.stock, 0), sku: variants[0]?.sku ?? '',
  };
}

export const IMAGE_BUCKET = 'product-images';
const isStoragePath = (s: string) => !!s && !/^(https?:|data:|blob:|\/)/.test(s);

/** Photos live in private storage; turn stored paths into week-long signed links. */
export async function signImages(paths: string[]): Promise<Record<string, string>> {
  const keys = [...new Set(paths.filter(isStoragePath))];
  if (!keys.length) return {};
  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(keys, 60 * 60 * 24 * 7);
  return Object.fromEntries((data ?? []).filter(d => d.signedUrl && d.path).map(d => [d.path as string, d.signedUrl]));
}

// Customers see active products only (enforced by database policy); staff also see hidden ones.
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*, product_variants(id,size,color,sku,stock)').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data as unknown as Row[];
  const signed = await signImages(rows.flatMap(r => r.images ?? []));
  return rows.map(r => ({ ...mapProduct(r), imagePaths: r.images ?? [], images: (r.images ?? []).map(i => signed[i] ?? i).filter(i => !isStoragePath(i)) }));
}

export async function fetchCategoryNames(): Promise<string[]> {
  const { data } = await supabase.from('categories').select('name').order('sort_order');
  return (data ?? []).map(c => c.name);
}

export const variantOf = (p: Product, size: string, color: string) => p.variants.find(v => v.size === size && v.color === color);
export const stockStatus = (p: Product) => p.stock === 0 ? 'Out of stock' : p.stock <= p.lowStockThreshold ? 'Low stock' : 'In stock';
