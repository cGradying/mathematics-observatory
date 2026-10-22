import { cp } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const pageEntries = Object.fromEntries(
  readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => [entry.name.slice(0, -'.html'.length), resolve(projectRoot, entry.name)]),
);

const geometryEntry = 'assets/js/geometry-visualizer';

// Keep classic browser scripts and fetched JSON at their documented URLs.
// The server-only api/ directory stays at the project root for Vercel Functions.
const copyRuntimeAssets = {
  name: 'copy-browser-runtime-assets',
  apply: 'build',
  async closeBundle() {
    await Promise.all(['assets', 'data'].map((directory) =>
      cp(resolve(projectRoot, directory), resolve(projectRoot, 'dist', directory), {
        recursive: true,
        // The bundled geometry visualizer (three.js inlined) must not be overwritten by the raw source.
        filter: (source) => !source.endsWith('geometry-visualizer.js'),
      }),
    ));
    // Linked from index.html as a download.
    await cp(resolve(projectRoot, 'docs/references/G11-General-Mathematics.pdf'),
      resolve(projectRoot, 'dist/docs/references/G11-General-Mathematics.pdf'));
  },
};

// Absolute URLs (canonical, og:url, og:image, sitemap) need the production origin.
// Set SITE_URL in Vercel; VERCEL_PROJECT_PRODUCTION_URL is the automatic fallback.
// With neither, those tags are omitted rather than pointing at a placeholder.
const siteEnv = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) || '';
const siteUrl = siteEnv.replace(/\/+$/, '');
const sitePages = ['', 'learn', 'explore', 'visualize', 'laboratory', 'challenges', 'history', 'proofs'];

const siteMeta = {
  name: 'site-meta',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const page = ctx.path.replace(/^\//, '').replace(/\.html$/, '');
      if (page === '404') return html;
      const tags = [
        '<link rel="manifest" href="/manifest.webmanifest">',
        ...(siteUrl ? [
          `<link rel="canonical" href="${siteUrl}/${page === 'index' ? '' : page}">`,
          `<meta property="og:url" content="${siteUrl}/${page === 'index' ? '' : page}">`,
          `<meta property="og:image" content="${siteUrl}/og-image.png">`,
          '<meta property="og:image:width" content="1200">',
          '<meta property="og:image:height" content="630">',
          `<meta name="twitter:image" content="${siteUrl}/og-image.png">`,
        ] : []),
      ];
      const cleaned = html.replace(/<meta name="twitter:card"[^>]*>\s*/, '');
      return cleaned.replace('</head>', `  <meta name="twitter:card" content="${siteUrl ? 'summary_large_image' : 'summary'}">\n  ${tags.join('\n  ')}\n</head>`);
    },
  },
  generateBundle() {
    const urls = siteUrl ? sitePages.map((p) => `  <url><loc>${siteUrl}/${p}</loc></url>`).join('\n') : '';
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /api/\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}` });
  },
};

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), copyRuntimeAssets, siteMeta],
  build: {
    rolldownOptions: {
      // geometry-visualizer is a stable-path entry so geometry-loader.js can import('./geometry-visualizer.js').
      input: { ...pageEntries, [geometryEntry]: resolve(projectRoot, 'assets/js/geometry-visualizer.js') },
      output: {
        entryFileNames: (chunk) => (chunk.name === geometryEntry ? '[name].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
