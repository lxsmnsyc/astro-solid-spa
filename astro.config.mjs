import { defineConfig } from 'astro/config';

import solidJs from "@astrojs/solid-js";
import tailwind from "@astrojs/tailwind";
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
});