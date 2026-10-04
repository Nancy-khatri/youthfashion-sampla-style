import { createFileRoute } from '@tanstack/react-router';
import { ShopPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/search')({head:()=>seo('Search the Collection | Youth Fashion Sampla','Find your fit in the Youth Fashion menswear collection.'),component:Page});
function Page(){return <ShopPage title="FIND YOUR FIT"/>}
