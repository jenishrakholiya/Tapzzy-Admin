import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f8f6',
        foreground: '#141414',
        card: '#ffffff',
        brand: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          500: '#111111',
          900: '#0a0a0a',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
