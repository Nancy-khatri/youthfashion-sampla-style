import { createFileRoute } from '@tanstack/react-router';
import { WishlistPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/wishlist')({head:()=>seo('Your Wishlist | Youth Fashion Sampla','Keep your favourite men’s clothing and footwear in one place.'),component:WishlistPage});
