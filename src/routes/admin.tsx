import { createFileRoute } from '@tanstack/react-router';
import { AdminPage } from '@/components/store/admin';
import { seo } from '@/lib/store/catalog';
export const Route=createFileRoute('/admin')({head:()=>{const head=seo('Store Admin Preview | Youth Fashion Sampla','Frontend-only store management preview for Youth Fashion Sampla.');return {meta:[...head.meta,{name:'robots',content:'noindex,nofollow'}]}},component:AdminPage});
