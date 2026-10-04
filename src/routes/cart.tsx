import { createFileRoute } from '@tanstack/react-router';
import { CartPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/cart')({head:()=>seo('Your Shopping Bag | Youth Fashion Sampla','Review your selected men’s fashion, sizes and quantities.'),component:CartPage});
