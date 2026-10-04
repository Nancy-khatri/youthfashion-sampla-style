import { describe,it,expect } from 'vitest';
import { demoProducts,filterProducts,subtotal } from './catalog';
describe('Demo collection business rules',()=>{
 it('shows Black Printed T-Shirt for T-shirts under ₹500',()=>{expect(filterProducts(demoProducts,{category:'T-Shirts',maxPrice:500}).map(p=>p.name)).toEqual(['Black Printed T-Shirt']);});
 it('finds shoes under ₹1500',()=>{expect(filterProducts(demoProducts,{category:'Shoes',maxPrice:1500}).map(p=>p.price)).toEqual([1499]);});
 it('calculates two ₹499 T-shirts as ₹998',()=>{expect(subtotal([{productId:'black-printed-tshirt',size:'M',color:'Black',quantity:2}],demoProducts)).toBe(998);});
 it('keeps every sample product explicitly marked demo',()=>{expect(demoProducts.length).toBeGreaterThan(0);expect(demoProducts.every(p=>p.isDemo&&p.sku.startsWith('DEMO-'))).toBe(true);});
 it('filters size M and black accurately',()=>{expect(filterProducts(demoProducts,{size:'M',color:'Black'}).map(p=>p.id)).toEqual(['black-printed-tshirt']);});
});
