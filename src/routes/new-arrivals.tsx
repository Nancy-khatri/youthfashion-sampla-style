import { createFileRoute } from '@tanstack/react-router';
import { ShopPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/new-arrivals')({head:()=>seo('New Arrivals | Youth Fashion Sampla','Fresh fits and new menswear styles from Youth Fashion Sampla.'),component:Page});
const initial={newArrival:true};
function Page(){return <ShopPage initial={initial} title="FRESH FITS. JUST DROPPED."/>}
