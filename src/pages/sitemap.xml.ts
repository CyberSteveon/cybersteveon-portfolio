import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Only public content routes belong here; never include the API or error page.
export const GET: APIRoute = async ({ site }) => {
    if (!site) throw new Error('Astro site URL is required for sitemap generation');
    const projects = await getCollection('projects');
    const paths = ['/', '/about', '/projects', '/resume', '/contact',
        ...projects.map(project => `/projects/${project.data.slug}`).sort()];
    const escapeXml = (value: string) => value.replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    const entries = paths.map(path => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
};
