import { describe, it, expect } from 'vitest';
import { addressSchema, clampQuantity } from './validation';
const valid = { fullName: 'Test Customer', phone: '9876543210', house: '12', street: 'Beri Mod', city: 'Sampla', state: 'Haryana', pin: '124501' };
describe('Checkout and stock rules', () => {
  it('accepts PIN 124501', () => expect(addressSchema.safeParse(valid).success).toBe(true));
  it('rejects a five-digit PIN', () => expect(addressSchema.safeParse({ ...valid, pin: '12450' }).success).toBe(false));
  it('rejects a nine-digit mobile', () => expect(addressSchema.safeParse({ ...valid, phone: '987654321' }).success).toBe(false));
  it('never goes below one', () => expect(clampQuantity(-1, 10)).toBe(1));
  it('never exceeds stock of ten', () => expect(clampQuantity(12, 10)).toBe(10));
});
