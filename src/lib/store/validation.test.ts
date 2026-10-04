import { describe,it,expect } from 'vitest';
import { checkoutSchema,clampQuantity } from './validation';
const valid={name:'Demo Customer',mobile:'9876543210',email:'',address:'Beri Mod',city:'Sampla',state:'Haryana',pin:'124501'};
describe('Indian checkout and inventory rules',()=>{
 it('accepts the store PIN code 124501',()=>expect(checkoutSchema.safeParse(valid).success).toBe(true));
 it('rejects a five-digit PIN code',()=>expect(checkoutSchema.safeParse({...valid,pin:'12450'}).success).toBe(false));
 it('rejects a nine-digit mobile number',()=>expect(checkoutSchema.safeParse({...valid,mobile:'987654321'}).success).toBe(false));
 it('rejects missing delivery address',()=>expect(checkoutSchema.safeParse({...valid,address:''}).success).toBe(false));
 it('requires at least one item',()=>expect(clampQuantity(-1,10)).toBe(1));
 it('does not exceed stock of ten',()=>expect(clampQuantity(12,10)).toBe(10));
});
