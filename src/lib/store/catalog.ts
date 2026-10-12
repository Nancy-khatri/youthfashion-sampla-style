import { NEW_ARRIVALS } from './categories';
import type { CartLine, Filters, Product } from './types';
export type { Product, Filters, CartLine, Category, Variant } from './types';
export { storeConfig, productEnquiry } from './config';
export { categories, newArrivalsCategory, NEW_ARRIVALS } from './categories';
export { fetchProducts, variantOf, stockStatus } from './repository';
export const visible = (products: Product[]) => products.filter(p => p.active);
export const priceOf = (p: Product) => p.discountPrice ?? p.price;
export const money = (n: number) => '₹' + n.toLocaleString('en-IN');
export function filterProducts(products: Product[], f: Filters) {
  const q = f.query?.trim().toLowerCase();
  const newOnly = f.newArrival || f.category === NEW_ARRIVALS;
  const cat = f.category === NEW_ARRIVALS ? undefined : f.category;
  return visible(products).filter(p =>
    (!q || `${p.name} ${p.category} ${p.subcategory ?? ''} ${p.tags.join(' ')}`.toLowerCase().includes(q)) &&
    (!cat || p.category === cat) && (!newOnly || p.newArrival) &&
    (!f.maxPrice || priceOf(p) <= f.maxPrice) && (!f.size || p.sizes.includes(f.size)) && (!f.color || p.colors.includes(f.color)) &&
    (!f.brand || p.brand === f.brand) && (!f.availability || (f.availability === 'in' ? p.stock > 0 : p.stock === 0)) && (!f.style || p.tags.includes(f.style))
  ).sort((a, b) => f.sort === 'low' ? priceOf(a) - priceOf(b) : f.sort === 'high' ? priceOf(b) - priceOf(a) : b.createdAt.localeCompare(a.createdAt));
}
export const lineKey = (l: CartLine) => `${l.productId}:${l.size}:${l.color}`;
export const subtotal = (lines: CartLine[], products: Product[]) => lines.reduce((sum, l) => { const p = products.find(p => p.id === l.productId); return sum + (p ? priceOf(p) * l.quantity : 0); }, 0);
export const seo = (title: string, description: string) => ({ meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] });
