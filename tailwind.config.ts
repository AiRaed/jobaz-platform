import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: '#1C1C1E',
        platinum: '#EAEAEA',
        page: '#0D0D0D',
        surface: '#141414',
        text: '#EAEAEA',
        'text-muted': '#BEBEBE',
        /* JobAZ brand tokens — resolve from CSS vars (day/dark aware) */
        jaz: {
          bg: 'var(--jaz-bg-day)',
          surface: 'var(--jaz-surface)',
          soft: 'var(--jaz-surface-soft)',
          border: 'var(--jaz-border)',
          primary: 'var(--jaz-primary)',
          'primary-2': 'var(--jaz-primary-2)',
          purple: 'var(--jaz-purple)',
          lavender: 'var(--jaz-lavender)',
          text: 'var(--jaz-text)',
          muted: 'var(--jaz-muted)',
        },
        violet: {
          accent: '#7C3AED',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.08)',
        'medium': '0 4px 16px rgba(0,0,0,0.12)',
        'large': '0 8px 32px rgba(0,0,0,0.16)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
export default config
