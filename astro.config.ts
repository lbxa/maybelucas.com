import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://maybelucas.com",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport"
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'dark-plus',
        // themes: { // TODO make theme switcher work
        //   light: 'light-plus',
        //   dark: 'dark-plus',
        // },
      }
    }), 
    tailwind(), 
    solidJs(), 
    icon({iconDir: "src/assets/icons"})
  ]
});