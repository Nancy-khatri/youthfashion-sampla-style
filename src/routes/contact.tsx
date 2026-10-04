import { createFileRoute } from '@tanstack/react-router';
import { ContactPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/contact')({head:()=>seo('Contact & Location | Youth Fashion Sampla','Visit Youth Fashion at Beri Mod, Sampla, Haryana 124501 or contact the shop on Instagram.'),component:ContactPage});
