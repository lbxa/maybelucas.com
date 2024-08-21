import type { Config } from "tailwindcss";

export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
	corePlugins: {
		preflight: false // NOT RECOMMENDED
	}
} satisfies Config;
