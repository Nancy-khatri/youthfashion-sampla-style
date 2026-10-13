import { describe, expect, it } from 'vitest';
import { buildVariants, nextStatuses, validateProductDraft } from './admin-helpers';

const base = { name: 'Tee', price: 500, category: 'T-Shirts' };
describe('owner dashboard rules', () => {
  it('creates one stock row per size and colour, keeping existing stock', () => {
    const v = buildVariants(['M', 'L'], ['Black', 'White'], [{ id: 'a', size: 'M', color: 'Black', sku: 'X', stock: 7 }], 'TEE');
    expect(v).toHaveLength(4);
    expect(v.find(x => x.size === 'M' && x.color === 'Black')?.stock).toBe(7);
    expect(v.find(x => x.size === 'L' && x.color === 'White')?.stock).toBe(0);
  });
  it('rejects a discount price that is not lower than the price', () => {
    expect(validateProductDraft({ ...base, discountPrice: 500, variants: [{ size: 'M', color: 'B', sku: 'A', stock: 1 }] })).toMatch(/lower/);
  });
  it('rejects negative stock', () => {
    expect(validateProductDraft({ ...base, variants: [{ size: 'M', color: 'B', sku: 'A', stock: -1 }] })).toMatch(/negative/);
  });
  it('rejects duplicate SKUs', () => {
    expect(validateProductDraft({ ...base, variants: [{ size: 'M', color: 'B', sku: 'A', stock: 1 }, { size: 'L', color: 'B', sku: 'A', stock: 1 }] })).toMatch(/different SKU/);
  });
  it('only lets unpaid orders be cancelled', () => {
    expect(nextStatuses('pending_payment')).toEqual(['cancelled']);
    expect(nextStatuses('paid')).toContain('shipped');
    expect(nextStatuses('delivered')).toEqual([]);
  });
});
