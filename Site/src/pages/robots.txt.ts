import siteConfig from '../../site.config.mjs';

const sitemapUrl = new URL('/sitemap-index.xml', siteConfig.site).toString();

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
