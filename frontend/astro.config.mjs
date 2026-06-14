// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: vercel(),
  vite: {
    ssr: {
      noExternal: ['maplibre-gl', 'react-map-gl', '@deck.gl/react', '@deck.gl/aggregation-layers', '@deck.gl/core'],
    },
  },
});