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

// Keep classic browser scripts and fetched JSON at their documented URLs.
// The server-only api/ directory stays at the project root for Vercel Functions.
const copyRuntimeAssets = {
  name: 'copy-browser-runtime-assets',
  apply: 'build',
  async closeBundle() {
    await Promise.all(['assets', 'data'].map((directory) =>
      cp(resolve(projectRoot, directory), resolve(projectRoot, 'dist', directory), { recursive: true }),
    ));
  },
};

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), copyRuntimeAssets],
  build: {
    rolldownOptions: {
      input: pageEntries,
    },
  },
});
