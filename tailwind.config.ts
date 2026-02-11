import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f2',
          100: '#fbe5e5',
          200: '#f5c4c5',
          300: '#ec9a9b',
          400: '#d65456',
          500: '#a62325',
          600: '#8e1e20',
          700: '#7E191B',
          800: '#6a1517',
          900: '#501012',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
