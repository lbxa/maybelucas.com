import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import icon from "astro-icon";
import partytown from "@astrojs/partytown";

const DEV = process.env.NODE_ENV !== 'production';

// https://astro.build/config
export default defineConfig({
  site: DEV ? 'http://localhost:4321' : 'https://maybelucas.com',
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
  })]
});