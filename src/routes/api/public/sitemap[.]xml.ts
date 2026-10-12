import { createFileRoute } from '@tanstack/react-router';

export const Route=createFileRoute('/api/public/sitemap.xml')({server:{handlers:{GET:({request})=>{const origin=new URL(request.url).origin;const paths=['/','/shop','/categories','/new-arrivals','/about','/contact'];return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}})}}}});
