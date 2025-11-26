/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--color-primary)',
        'brand-secondary': 'var(--color-secondary)',
        'brand-accent': 'var(--color-accent)',
        'brand-text': 'var(--color-text)',
        'brand-blue': 'var(--color-blue)',
        
        'brand-light': '#8B949E',
        'brand-red': '#EF4444',
        'brand-green': '#22C55E',
        'brand-yellow': '#EAB308',
        'brand-orange': '#F97316',
        'brand-purple': '#8B5CF6',
        'brand-cyan': '#06B6D4',
        
        'sie-blue-950': '#0d1a2e',
        'sie-blue-900': '#102a4e',
        'sie-blue-800': '#1b3f7a',
        'sie-blue-700': '#2455a7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
        'loading-bar': 'loadingBar 1.5s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        loadingBar: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}