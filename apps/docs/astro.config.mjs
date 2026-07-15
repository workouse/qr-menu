// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'QR Menu Docs',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        tr: {
          label: 'Türkçe',
          lang: 'tr',
        },
      },
      sidebar: [
        {
          label: 'User Documentation',
          translations: { tr: 'Kullanıcı Dokümantasyonu' },
          items: [{ autogenerate: { directory: 'user' } }],
        },
        {
          label: 'Developer Documentation',
          translations: { tr: 'Geliştirici Dokümantasyonu' },
          items: [{ autogenerate: { directory: 'developer' } }],
        },
      ],
    }),
  ],

  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),

  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/starlight', 'astro-expressive-code', 'postcss'],
    },
    ssr: {
      external: ['node:path', 'path', 'node:url', 'url', 'node:fs', 'fs', 'node:util', 'util'],
    },
  },
});