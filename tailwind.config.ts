import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  		},
  		spacing: {
  			navbar: '3.5rem'
  		},
  		colors: {
  			// Core semantic colors (RGB format from color-palette.md)
  			background: 'rgb(var(--background) / <alpha-value>)',
  			foreground: 'rgb(var(--foreground) / <alpha-value>)',
  			card: {
  				DEFAULT: 'rgb(var(--card) / <alpha-value>)',
  				foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
  				foreground: 'rgb(var(--popover-foreground) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
  				foreground: 'rgb(var(--primary-foreground) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
  				foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
  				foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
  				foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
  				foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)'
  			},
  			border: 'rgb(var(--border) / <alpha-value>)',
  			input: 'rgb(var(--input) / <alpha-value>)',
  			ring: 'rgb(var(--ring) / <alpha-value>)',
  			// Custom brand tokens
  			'subtle-bg': 'rgb(var(--subtle-bg) / <alpha-value>)',
  			'elevated-bg': 'rgb(var(--elevated-bg) / <alpha-value>)',
  			success: 'rgb(var(--success) / <alpha-value>)',
  			warning: 'rgb(var(--warning) / <alpha-value>)',
  			info: 'rgb(var(--info) / <alpha-value>)',
  			// Chart colors (keep HSL for backwards compatibility)
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontSize: {
  			'input-mobile': '16px', // Prevents zoom on mobile Safari
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
