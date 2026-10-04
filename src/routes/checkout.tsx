import { createFileRoute } from '@tanstack/react-router';
import { CheckoutPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/checkout')({head:()=>seo('Checkout Preview | Youth Fashion Sampla','Preview delivery details and your order summary. Payments and real orders are not live yet.'),component:CheckoutPage});
