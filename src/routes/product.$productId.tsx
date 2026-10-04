import { createFileRoute } from '@tanstack/react-router';
import { ProductPage } from '@/components/store/pages';
import { productRepository, seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/product/$productId')({head:({params})=>seo(`${productRepository.get(params.productId)?.name??'Product'} | Youth Fashion Sampla`,'Explore the fit, size, price and style details of the Youth Fashion Sampla demo collection.'),component:Page});
function Page(){const {productId}=Route.useParams();return <ProductPage id={productId}/>}
