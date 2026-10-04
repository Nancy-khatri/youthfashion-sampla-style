import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/components/store/home';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/')({head:()=>seo("Youth Fashion Sampla | Men's Fashion & Clothing","Discover men's fashion in Sampla, Haryana. Shop T-shirts, shirts, jeans and shoes at Youth Fashion, Beri Mod, with delivery across India."),component:HomePage});
