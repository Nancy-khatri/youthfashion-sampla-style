import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPage } from '@/components/store/pages';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/categories')({head:()=>seo('Categories | Youth Fashion Sampla','Explore T-shirts, shirts, jeans, track pants, shoes and belts for men.'),component:CategoriesPage});
