/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          50: '#FAF6ED',   // Warm Ivory tint
          100: '#F5E8C3',  // Soft Champagne
          200: '#E8D298',  // Light Champagne Gold
          300: '#D4AF5A',  // Secondary Gold / Light Gold
          400: '#C49A3C',  // Rich Gold
          500: '#B88A2E',  // Primary Champagne Gold
          600: '#9C7323',  // Deep Gold
          700: '#8C671F',  // Dark Deep Gold
          800: '#6E4F16',  // Darker Gold
          900: '#523A0F',  // Darkest Gold
          950: '#3D2A0A',  // Ultra Dark Gold
        },
        ai: {
          50: '#F5F3F8',
          100: '#E8E4EF',
          200: '#D2CADF',
          500: '#6D5A8D',  // Muted Plum AI Accent
          600: '#5A4977',
          700: '#483861',
        },
        ivory: {
          DEFAULT: '#F8F6EF',
          50: '#FCFBF7',
          100: '#F8F6EF',
          200: '#F1ECE0',
        },
        charcoal: {
          DEFAULT: '#25231F',
          500: '#25231F',
          600: '#1F1D1A',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium-sm': '0 1px 2px 0 rgba(0,0,0,0.02), 0 1px 3px 0 rgba(0,0,0,0.03)',
        'premium': '0 1px 3px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 1px 4px 0 rgba(0,0,0,0.02)',
        'premium-md': '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 10px -2px rgba(0,0,0,0.03)',
        'premium-lg': '0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 12px -2px rgba(0,0,0,0.03)',
        'premium-xl': '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 20px -4px rgba(0,0,0,0.03)',
        'glow': '0 0 20px rgba(184, 138, 46, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'fade-in-left': 'fadeInLeft 0.4s ease-out',
        'fade-in-right': 'fadeInRight 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-3px)' },
          '75%': { transform: 'translateY(-1px)' },
        },
        ripple: {
          '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 0 20px rgba(59, 130, 246, 0)' },
        },
      }
    },
  },
  plugins: [],
}
