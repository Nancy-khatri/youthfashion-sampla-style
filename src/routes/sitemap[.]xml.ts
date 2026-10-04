import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/sitemap.xml')({server:{handlers:{GET:({request})=>Response.redirect(new URL('/api/public/sitemap.xml',request.url),302)}}});
