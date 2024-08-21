import type { Config } from "tailwindcss";

export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
		spacing: {
			'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
      '2xl': '32px',
      '3xl': '48px',
		}
	},
	plugins: [],
} satisfies Config;
