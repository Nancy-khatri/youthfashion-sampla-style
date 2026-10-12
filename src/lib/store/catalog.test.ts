import { describe, it, expect } from 'vitest';
import { filterProducts, subtotal, productEnquiry, type Product } from './catalog';
const mk = (o: Partial<Product>): Product => ({ id: 'a', name: 'Black Tee', category: 'T-Shirts', description: '', price: 499, images: [], sizes: ['M'], colors: ['Black'], stock: 5, sku: 'S1', featured: false, newArrival: false, active: true, createdAt: '2026-01-01', updatedAt: '2026-01-01', tags: [], brand: 'Youth Fashion', isDemo: false, variants: [{ id: 'v', size: 'M', color: 'Black', sku: 'S1', stock: 5 }], lowStockThreshold: 3, ...o });
const list = [mk({}), mk({ id: 'b', name: 'Shoe', category: 'Shoes', price: 1499 }), mk({ id: 'c', name: 'Sale Shirt', category: 'Shirts', price: 999, discountPrice: 799 })];
describe('Catalog rules', () => {
  it('filters T-shirts under ₹500', () => { expect(filterProducts(list, { category: 'T-Shirts', maxPrice: 500 }).map(p => p.id)).toEqual(['a']); });
  it('uses the discount price as selling price', () => { expect(subtotal([{ productId: 'c', size: 'M', color: 'Black', quantity: 2 }], list)).toBe(1598); });
  it('hides inactive products', () => { expect(filterProducts([mk({ active: false })], {}).length).toBe(0); });
  it('builds the WhatsApp enquiry', () => { expect(productEnquiry('Black Tee', 499)).toBe('Hi Youth Fashion Sampla, I am interested in Black Tee. Price: ₹499.'); });
});
