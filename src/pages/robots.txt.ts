import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapUrl: URL, sitemapIndexUrl: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
Sitemap: ${sitemapIndexUrl.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap.xml", site);
  const sitemapIndexUrl = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapUrl, sitemapIndexUrl));
};
