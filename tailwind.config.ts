import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme"

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
			fontFamily: {
				mono: ["ui-monospace", ...defaultTheme.fontFamily.mono],
				sans: ["Neue Montreal", ...defaultTheme.fontFamily.sans],
				serif: ["Signifier", ...defaultTheme.fontFamily.serif],
			},
			spacing: {
				'xs': '0.25rem',  // 4px / 16 = 0.25rem
				'sm': '0.5rem',   // 8px / 16 = 0.5rem
				'md': '0.75rem',  // 12px / 16 = 0.75rem
				'lg': '1rem',     // 16px / 16 = 1rem
				'xl': '1.5rem',   // 24px / 16 = 1.5rem
				'2xl': '2rem',    // 32px / 16 = 2rem
				'3xl': '3rem',    // 48px / 16 = 3rem
			}
		}
	},
	darkMode: "selector",
	plugins: [],
} satisfies Config;
