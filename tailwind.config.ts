import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from '@tailwindcss/typography';

const config = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				'cn-serif': ['var(--font-cn-serif)', 'Noto Serif SC', 'STSong', 'serif'],
				'latin-serif': ['var(--font-latin-serif)', 'Source Serif 4', 'Georgia', 'serif'],
				'display': ['var(--font-display)', 'LXGW WenKai', 'KaiTi', 'STKaiti', 'serif'],
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				ink: {
					DEFAULT: "hsl(var(--ink))",
					light: "hsl(var(--ink-light))",
				},
				paper: {
					DEFAULT: "hsl(var(--paper))",
					warm: "hsl(var(--paper-warm))",
				},
				vermillion: "hsl(var(--vermillion))",
				'mountain-blue': "hsl(var(--mountain-blue))",
				jade: "hsl(var(--jade))",
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				heartbeat: {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.1)' },
				},
				"ink-spread": {
					'0%': { transform: 'scaleX(0)', opacity: '0' },
					'50%': { opacity: '1' },
					'100%': { transform: 'scaleX(1)', opacity: '1' },
				},
				"brush-reveal": {
					'0%': { clipPath: 'inset(0 100% 0 0)' },
					'100%': { clipPath: 'inset(0 0 0 0)' },
				},
				"fade-up": {
					'0%': { opacity: '0', transform: 'translateY(12px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				"float": {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				heartbeat: 'heartbeat 1s ease-in-out infinite',
				"ink-spread": "ink-spread 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
				"brush-reveal": "brush-reveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
				"fade-up": "fade-up 0.5s ease-out forwards",
				"float": "float 6s ease-in-out infinite",
			},
		},
	},
	plugins: [animate, typography],
} satisfies Config;

export default config;
