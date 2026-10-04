import tshirt from '@/assets/tshirt.jpg';
import graphic from '@/assets/graphic.jpg';
import shirt from '@/assets/shirt.jpg';
import jeans from '@/assets/jeans.jpg';
import track from '@/assets/track.jpg';
import shoes from '@/assets/shoes.jpg';
import belt from '@/assets/belt.jpg';
export const storeConfig = { name: 'YOUTH FASHION SAMPla', instagram: 'https://www.instagram.com/youthfashion_sampla/', whatsappNumber: '', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beri+Mod+Sampla+Haryana+124501', address: 'Beri Mod, Sampla, Haryana – 124501, India' };
export interface Product { id: string; name: string; description: string; category: string; price: number; discountPrice?: number | undefined; images: string[]; colors: string[]; sizes: string[]; stock: number; sku: string; tags: string[]; brand: string; isDemo: boolean; createdAt: string }
export const categories = [{name:'T-Shirts',image:tshirt},{name:'Shirts',image:shirt},{name:'Jeans & Trousers',image:jeans},{name:'Lower / Track Pants',image:track},{name:'Shoes',image:shoes},{name:'Belts',image:belt}];
// Development-only catalog. Replace this repository with a database adapter before taking live orders.
export const demoProducts: Product[] = [
 ['black-printed-tshirt','Black Printed T-Shirt','T-Shirts',499,tshirt,'Black',['S','M','L','XL'],'Casual'],
 ['oversized-graphic-tshirt','Oversized Graphic T-Shirt','T-Shirts',599,graphic,'Charcoal',['S','M','L','XL'],'Street Style'],
 ['premium-casual-shirt','Premium Casual Shirt','Shirts',899,shirt,'Off-white',['S','M','L','XL'],'Smart Casual'],
 ['mens-casual-shoes',"Men’s Casual Shoes",'Shoes',1499,shoes,'Off-white',['7','8','9','10'],'Everyday'],
 ['relaxed-fit-jeans','Relaxed Fit Jeans','Jeans & Trousers',1199,jeans,'Blue',['28','30','32','34'],'Everyday'],
 ['essential-track-pants','Essential Track Pants','Lower / Track Pants',699,track,'Charcoal',['S','M','L','XL'],'Casual'],
 ['classic-leather-belt','Classic Leather Belt','Belts',399,belt,'Black',['30','32','34','36'],'Smart Casual'],
].map((row,i) => ({id:String(row[0]),name:String(row[1]),category:String(row[2]),price:Number(row[3]),images:[String(row[4])],colors:[String(row[5])],sizes:row[6] as string[],tags:[String(row[7])],description:'A considered addition to your everyday wardrobe. Easy to style, from laid-back days to going out. Demo product — fabric details, measurements and availability will be confirmed with the real collection.',stock:10,sku:`DEMO-YF-${i+1}`,brand:'Youth Fashion',isDemo:true,createdAt:`2026-10-0${7-i}`}));
export const productRepository = { list: () => demoProducts, get: (id:string) => demoProducts.find(p=>p.id===id) };
export const priceOf = (p:Product) => p.discountPrice ?? p.price;
export const money = (n:number) => '₹' + n.toLocaleString('en-IN');
export interface Filters { query?:string | undefined; category?:string | undefined; maxPrice?:number | undefined; size?:string | undefined; color?:string | undefined; brand?:string | undefined; availability?:string | undefined; style?:string | undefined; sort?:string | undefined }
export function filterProducts(products:Product[],f:Filters) { return products.filter(p=>(!f.query || `${p.name} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(f.query.toLowerCase())) && (!f.category || p.category===f.category) && (!f.maxPrice || priceOf(p)<=f.maxPrice) && (!f.size || p.sizes.includes(f.size)) && (!f.color || p.colors.includes(f.color)) && (!f.brand || p.brand===f.brand) && (!f.availability || (f.availability==='in' ? p.stock>0:p.stock===0)) && (!f.style || p.tags.includes(f.style))).sort((a,b)=>f.sort==='low'?priceOf(a)-priceOf(b):f.sort==='high'?priceOf(b)-priceOf(a):b.createdAt.localeCompare(a.createdAt)); }
export interface CartLine { productId:string; size:string; color:string; quantity:number }
export const lineKey = (l:CartLine) => `${l.productId}:${l.size}:${l.color}`;
export const subtotal = (lines:CartLine[],products:Product[]) => lines.reduce((sum,l)=>sum+priceOf(products.find(p=>p.id===l.productId) ?? {price:0} as Product)*l.quantity,0);
export const seo = (title:string,description:string) => ({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]});
