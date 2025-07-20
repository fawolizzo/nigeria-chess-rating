import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
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
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4D160',
          dark: '#A68A24',
        },
        chess: {
          light: '#F0D9B5',
          dark: '#B58863',
        },
        nigeria: {
          green: 'hsl(var(--nigeria-green))',
          'green-light': 'hsl(var(--nigeria-green-light))',
          'green-dark': 'hsl(var(--nigeria-green-dark))',
          white: 'hsl(var(--nigeria-white))',
          'off-white': '#F5F5F5',
          'white-dim': 'hsl(var(--nigeria-white-dim))',
          yellow: 'hsl(var(--nigeria-yellow))',
          'yellow-light': 'hsl(var(--nigeria-yellow-light))',
          'yellow-dark': 'hsl(var(--nigeria-yellow-dark))',
          accent: 'hsl(var(--nigeria-accent))',
          'accent-light': 'hsl(var(--nigeria-accent-light))',
          'accent-dark': 'hsl(var(--nigeria-accent-dark))',
          black: '#000000',
          'black-soft': '#333333',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'slide-in': 'slide-in 0.5s ease-out',
        'pulse-gentle': 'pulse-gentle 2s infinite ease-in-out',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      backdropFilter: {
        none: 'none',
        blur: 'blur(8px)',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        neo: '5px 5px 10px #d1d1d1, -5px -5px 10px #ffffff',
        card: '0 2px 10px rgba(0, 135, 81, 0.08)',
        'card-hover': '0 4px 15px rgba(0, 135, 81, 0.15)',
      },
      backgroundImage: {
        'gradient-nigeria':
          'linear-gradient(135deg, hsl(var(--nigeria-green-light)) 0%, hsl(var(--nigeria-green)) 100%)',
        'gradient-nigeria-subtle':
          'linear-gradient(135deg, hsl(var(--nigeria-green-light)/0.05) 0%, hsl(var(--nigeria-green)/0.1) 100%)',
        'gradient-gold':
          'linear-gradient(135deg, hsl(var(--nigeria-yellow-light)) 0%, hsl(var(--nigeria-yellow)) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
