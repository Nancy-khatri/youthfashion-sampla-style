import { createFileRoute } from '@tanstack/react-router';
import { ProductPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/product/$productId')({head:({params})=>seo('Product Details | Youth Fashion Sampla','Explore the fit, sizes, colours and price of this Youth Fashion Sampla men’s style.'),component:Page});
function Page(){const {productId}=Route.useParams();return <ProductPage id={productId}/>}
