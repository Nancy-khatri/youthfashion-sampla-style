import { z } from 'zod';
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  house: z.string().trim().min(1, 'Enter your house or building number.').max(120),
  street: z.string().trim().min(2, 'Enter your street and locality.').max(200),
  city: z.string().trim().min(2, 'Enter your city.').max(80),
  state: z.string().trim().min(2, 'Enter your state.').max(80),
  pin: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code.'),
});
export const checkoutSchema = addressSchema;
export const clampQuantity = (quantity: number, stock: number) => Math.max(1, Math.min(stock, Math.floor(quantity)));
