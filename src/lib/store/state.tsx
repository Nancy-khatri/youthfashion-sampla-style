import { createContext, useContext, useState, type ReactNode } from 'react';
import { demoProducts, lineKey, type CartLine, type Product } from './catalog';
import { clampQuantity } from './validation';
import { toast } from 'sonner';
interface StoreState { cart:CartLine[]; wishlist:string[]; recent:string[]; products:Product[]; setProducts:(p:Product[])=>void; add:(p:Product,size:string,color:string,quantity?:number)=>void; quantity:(key:string,n:number)=>void; remove:(key:string)=>void; toggleWish:(id:string)=>void; view:(id:string)=>void }
const Context=createContext<StoreState|null>(null);
export function StoreProvider({children}:{children:ReactNode}) {
 const [cart,setCart]=useState<CartLine[]>([]),[wishlist,setWishlist]=useState<string[]>([]),[recent,setRecent]=useState<string[]>([]),[products,setProducts]=useState(demoProducts);
 function add(p:Product,size:string,color:string,quantity=1) { const line={productId:p.id,size,color,quantity}; setCart(old=>{const found=old.find(x=>lineKey(x)===lineKey(line));return found?old.map(x=>lineKey(x)===lineKey(line)?{...x,quantity:clampQuantity(x.quantity+quantity,p.stock)}:x):[...old,{...line,quantity:clampQuantity(quantity,p.stock)}]});toast.success('Added to your bag'); }
 return <Context.Provider value={{cart,wishlist,recent,products,setProducts,add,quantity:(key,n)=>setCart(old=>old.map(l=>lineKey(l)===key?{...l,quantity:clampQuantity(n,products.find(p=>p.id===l.productId)?.stock??1)}:l)),remove:key=>setCart(old=>old.filter(l=>lineKey(l)!==key)),toggleWish:id=>setWishlist(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]),view:id=>setRecent(old=>[id,...old.filter(x=>x!==id)].slice(0,4))}}>{children}</Context.Provider>
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('Store provider missing');return value;}
