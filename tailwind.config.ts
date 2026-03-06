import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        '3xs': ['9px', { lineHeight: '12px' }],
        '2xs': ['10px', { lineHeight: '14px' }],
        'xxs': ['11px', { lineHeight: '15px' }],
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#F7F3EC',
          2: '#EFE9DE',
        },
        ink: {
          DEFAULT: '#1A1714',
          2: '#4A4540',
          3: '#9A9390',
        },
        amber: {
          DEFAULT: '#E8963A',
          soft: '#FDF0E0',
          dark: '#C4741C',
        },
        teal: {
          DEFAULT: '#2E7D6E',
          soft: '#D8EDEA',
        },
        rose: '#C4634A',
        border: '#E4DDD4',

        /* shadcn/ui tokens */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          '50':  '#fdf2f2',
          '100': '#fbe5e5',
          '200': '#f5c4c5',
          '300': '#ec9a9b',
          '400': '#d65456',
          '500': '#a62325',
          '600': '#8e1e20',
          '700': '#7E191B',
          '800': '#6a1517',
          '900': '#501012',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        'xs':  '8px',
        'sm':  '10px',
        'md':  '14px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '44px',
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        's': '0 1px 4px rgba(26,23,20,0.06)',
        'm': '0 4px 20px rgba(26,23,20,0.09)',
        'l': '0 12px 40px rgba(26,23,20,0.14)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
