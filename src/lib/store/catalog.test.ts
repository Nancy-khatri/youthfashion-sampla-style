import { describe,it,expect } from 'vitest';
import { demoProducts,filterProducts,subtotal,productEnquiry } from './catalog';
describe('Catalog business rules',()=>{
 it('shows Black Printed T-Shirt for T-shirts under ₹500',()=>{expect(filterProducts(demoProducts,{category:'T-Shirts',maxPrice:500}).map(p=>p.name)).toEqual(['Black Printed T-Shirt']);});
 it('finds shoes under ₹1500',()=>{expect(filterProducts(demoProducts,{category:'Shoes',maxPrice:1500}).map(p=>p.price)).toEqual([1499]);});
 it('calculates two ₹499 T-shirts as ₹998',()=>{expect(subtotal([{productId:'black-printed-tshirt',size:'M',color:'Black',quantity:2}],demoProducts)).toBe(998);});
 it('keeps every sample product explicitly marked demo',()=>{expect(demoProducts.every(p=>p.isDemo&&p.sku.startsWith('DEMO-'))).toBe(true);});
 it('filters size M and black accurately',()=>{expect(filterProducts(demoProducts,{size:'M',color:'Black'}).map(p=>p.id)).toEqual(['black-printed-tshirt']);});
 it('hides disabled products from the shop',()=>{const list=demoProducts.map(p=>p.id==='black-printed-tshirt'?{...p,active:false}:p);expect(filterProducts(list,{category:'T-Shirts'}).map(p=>p.id)).not.toContain('black-printed-tshirt');});
 it('New Arrivals category shows only products marked new',()=>{expect(filterProducts(demoProducts,{category:'New Arrivals'}).every(p=>p.newArrival)).toBe(true);});
 it('builds the WhatsApp enquiry message',()=>{expect(productEnquiry('Black Printed T-Shirt',499)).toBe('Hi Youth Fashion Sampla, I am interested in Black Printed T-Shirt. Price: ₹499.');});
});
