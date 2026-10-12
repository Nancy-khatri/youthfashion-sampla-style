import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { lineKey, type CartLine, type Product } from './catalog';
import { clampQuantity } from './validation';
import { fetchProducts, variantOf } from './repository';
import { toast } from 'sonner';

interface StoreState { cart:CartLine[]; wishlist:string[]; recent:string[]; products:Product[]; loading:boolean; refresh:()=>Promise<void>; add:(p:Product,size:string,color:string,quantity?:number)=>void; quantity:(key:string,n:number)=>void; remove:(key:string)=>void; clearCart:()=>void; inCart:(productId:string,size?:string,color?:string)=>boolean; toggleWish:(id:string)=>void; view:(id:string)=>void }
const Context=createContext<StoreState|null>(null);
const CART_KEY='yf-cart-v2', WISH_KEY='yf-wishlist';
const stockFor=(products:Product[],l:CartLine)=>{const p=products.find(p=>p.id===l.productId);return p?variantOf(p,l.size,l.color)?.stock??0:0;};

export function StoreProvider({children}:{children:ReactNode}) {
  const [cart,setCart]=useState<CartLine[]>([]),[wishlist,setWishlist]=useState<string[]>([]),[recent,setRecent]=useState<string[]>([]),[products,setProducts]=useState<Product[]>([]),[loading,setLoading]=useState(true),[hydrated,setHydrated]=useState(false);
  const refresh=useCallback(async()=>{try{setProducts(await fetchProducts())}catch{toast.error('Could not load products. Please refresh.')}finally{setLoading(false)}},[]);
  useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem(CART_KEY)??'[]'));setWishlist(JSON.parse(localStorage.getItem(WISH_KEY)??'[]'))}catch{/* ignore */}setHydrated(true);void refresh();},[refresh]);
  useEffect(()=>{if(hydrated){localStorage.setItem(CART_KEY,JSON.stringify(cart));localStorage.setItem(WISH_KEY,JSON.stringify(wishlist))}},[cart,wishlist,hydrated]);
  function add(p:Product,size:string,color:string,quantity=1){const stock=variantOf(p,size,color)?.stock??0;if(stock<1){toast.error('This size and colour is out of stock.');return;}const line={productId:p.id,size,color,quantity};setCart(old=>{const found=old.find(x=>lineKey(x)===lineKey(line));return found?old.map(x=>lineKey(x)===lineKey(line)?{...x,quantity:clampQuantity(x.quantity+quantity,stock)}:x):[...old,{...line,quantity:clampQuantity(quantity,stock)}]});toast.success('Added to your bag');}
  return <Context.Provider value={{cart,wishlist,recent,products,loading,refresh,add,
    quantity:(key,n)=>setCart(old=>old.map(l=>lineKey(l)===key?{...l,quantity:clampQuantity(n,Math.max(1,stockFor(products,l)))}:l)),
    remove:key=>setCart(old=>old.filter(l=>lineKey(l)!==key)),clearCart:()=>setCart([]),
    inCart:(id,size,color)=>cart.some(l=>l.productId===id&&(!size||l.size===size)&&(!color||l.color===color)),
    toggleWish:id=>setWishlist(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]),
    view:id=>setRecent(old=>[id,...old.filter(x=>x!==id)].slice(0,4))}}>{children}</Context.Provider>
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('Store provider missing');return value;}
