import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

// Canonical origin for absolute metadata URLs (og:image, canonical, sitemap). Set SITE_URL at build
// time when deploying somewhere else, e.g. a custom domain.
const SITE_URL = (process.env.SITE_URL || 'https://hellotype.pages.dev').replace(/\/+$/, '');

/** Fills `__SITE_URL__` in index.html and emits the crawler files that need absolute URLs. */
function siteMeta(): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: html => html.replaceAll('__SITE_URL__', SITE_URL),
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${SITE_URL}/og-image.png</image:loc></image:image>
  </url>
</urlset>
`,
      });
    },
  };
}

// `base` is relative so the build works from any path (e.g. GitHub Pages /<repo>/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), siteMeta()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
