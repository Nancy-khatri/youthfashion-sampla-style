import { createFileRoute } from '@tanstack/react-router';
import { ShopPage } from '@/components/store/pages';
import { seo, type Filters } from '@/lib/store/catalog';
export const Route=createFileRoute('/shop')({validateSearch:(s:Record<string,unknown>):Filters=>({category:typeof s['category']==='string'?s['category']:undefined,style:typeof s['style']==='string'?s['style']:undefined,query:typeof s['query']==='string'?s['query']:undefined}),head:()=>seo('Shop Men’s Clothing | Youth Fashion Sampla','Browse men’s clothing, T-shirts, shirts, jeans, footwear and accessories from Youth Fashion Sampla, Haryana.'),component:Page});
function Page(){const search=Route.useSearch();return <ShopPage initial={search}/>}
