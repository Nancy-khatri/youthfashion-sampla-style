import { createFileRoute } from '@tanstack/react-router';
import { ShopPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/new-arrivals')({head:()=>seo('New Arrivals | Youth Fashion Sampla','Fresh fits and new menswear styles from Youth Fashion Sampla.'),component:Page});
function Page(){return <ShopPage title="FRESH FITS. JUST DROPPED."/>}
