import type { Config } from "tailwindcss";

export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				shark: {
					'50': '#f6f6f6',
					'100': '#e7e7e7',
					'200': '#d1d1d1',
					'300': '#b0b0b0',
					'400': '#888888',
					'500': '#6d6d6d',
					'600': '#5d5d5d',
					'700': '#4f4f4f',
					'800': '#454545',
					'900': '#3d3d3d',
					'950': '#121212',
				},
				ivory: '#f5f5f5'
			},
		},
		spacing: {
			'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
      '2xl': '32px',
      '3xl': '48px',
		}
	},
	darkMode: "selector",
	plugins: [],
} satisfies Config;
