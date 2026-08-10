// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'child_process';

// https://astro.build/config
export default defineConfig({
  site: 'https://jasperkooij.com',
  session: false,

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['sharp']
    },
    optimizeDeps: {
      include: ['astro/assets/services/noop']
    }
  },

  adapter: cloudflare({
    imageService: 'passthrough'
  }),
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport'
  },

  integrations: [
    svelte(),
    sitemap({
      serialize(item) {
        try {
          const lastmod = execSync('git log -1 --format=%ci -- .').toString().trim().split(' ')[0];
          if (lastmod) item.lastmod = lastmod;
        } catch {}
        return item;
      }
    })
  ]
});