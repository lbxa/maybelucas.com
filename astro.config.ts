import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import rehypeExternalLinks from 'rehype-external-links';
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import icon from "astro-icon";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://maybelucas.com',

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport"
  },

  build: {
    inlineStylesheets: 'auto',
    assets: '_astro'
  },

  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'three': ['three'],
            'solid': ['solid-js', '@nanostores/solid', 'nanostores']
          }
        }
      }
    },
    ssr: {
      noExternal: ['three']
    }
  },

  integrations: [
    mdx({
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer']
        }
      ]
    ],
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { 
        light: "light-plus",
        dark: "dark-plus",
      },
    }
  }), 
  tailwind(), 
  solidJs(), 
  icon({iconDir: "src/assets/icons"}), 
  partytown({
    config: {
      forward: ["dataLayer.push"],
    }
  }),
  sitemap()],
  adapter: cloudflare()
});
