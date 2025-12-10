import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px (was 12px)
        sm: ['0.9375rem', { lineHeight: '1.375rem' }], // 15px (was 14px)
        base: ['1.0625rem', { lineHeight: '1.625rem' }], // 17px (was 16px)
        lg: ['1.1875rem', { lineHeight: '1.875rem' }], // 19px (was 18px)
        xl: ['1.375rem', { lineHeight: '2rem' }], // 22px (was 20px)
        '2xl': ['1.625rem', { lineHeight: '2.25rem' }], // 26px (was 24px)
        '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32px (was 30px)
        '4xl': ['2.5rem', { lineHeight: '3rem' }], // 40px (was 36px)
        '5xl': ['3.25rem', { lineHeight: '3.75rem' }], // 52px (was 48px)
        '6xl': ['4rem', { lineHeight: '4.5rem' }], // 64px (was 60px)
        '7xl': ['5rem', { lineHeight: '5.5rem' }], // 80px (was 72px)
        '8xl': ['6.5rem', { lineHeight: '7rem' }], // 104px (was 96px)
        '9xl': ['8.5rem', { lineHeight: '9rem' }], // 136px (was 128px)
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          '50': '#ffffe7',
          '100': '#ffffc1',
          '200': '#fffb86',
          '300': '#fff041',
          '400': '#ffe00d',
          '500': '#ffd100',
          '600': '#d19900',
          '700': '#a66d02',
          '800': '#89550a',
          '900': '#74450f',
          '950': '#442404',
        },
        text: {
          light: '#000000',
          dark: '#ffffff',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
          active: 'hsl(var(--sidebar-active))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 6px)',
        sm: 'calc(var(--radius) - 10px)',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgb(0 0 0 / 0.15), 0 1px 3px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 8px 16px -2px rgb(0 0 0 / 0.2), 0 4px 8px -4px rgb(0 0 0 / 0.15)',
        dialog: '0 24px 48px -12px rgb(0 0 0 / 0.4), 0 12px 24px -8px rgb(0 0 0 / 0.3)',
        dropdown: '0 12px 24px -4px rgb(0 0 0 / 0.25), 0 6px 12px -6px rgb(0 0 0 / 0.2)',
        popover: '0 12px 24px -4px rgb(0 0 0 / 0.25), 0 6px 12px -6px rgb(0 0 0 / 0.2)',
      },
      animation: {
        'shiny-text': 'shiny-text 8s infinite',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        'honeycomb-shine': 'honeycomb-shine 1.5s ease-in-out',
      },
      keyframes: {
        'shiny-text': {
          '0%, 90%, 100%': {
            'background-position': 'calc(-100% - var(--shiny-width)) 0',
          },
          '30%, 60%': {
            'background-position': 'calc(100% + var(--shiny-width)) 0',
          },
        },
        'border-beam': {
          '100%': {
            'offset-distance': '100%',
          },
        },
        'honeycomb-shine': {
          '0%': {
            transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
          },
          '100%': {
            transform: 'translateX(100%) translateY(100%) rotate(45deg)',
          },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
