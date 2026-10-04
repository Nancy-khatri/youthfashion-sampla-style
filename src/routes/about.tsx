import { createFileRoute } from '@tanstack/react-router';
import { AboutPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/about')({head:()=>seo('About the Store | Youth Fashion Sampla','Your local men’s fashion destination at Beri Mod, Sampla, Haryana, now serving India.'),component:AboutPage});
