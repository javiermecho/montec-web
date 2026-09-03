/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#FF5500',
          hover: '#FF6600',
          dark: '#E04B00',
          glow: 'rgba(255, 85, 0, 0.35)',
          surface: '#121212',
          surfaceDark: '#0A0A0A',
          card: '#161616',
          cardBorder: '#27272A',
          muted: '#9CA3AF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'neon': '0 0 20px -2px rgba(255, 85, 0, 0.45)',
        'neon-lg': '0 0 35px 2px rgba(255, 85, 0, 0.55)',
        'neon-sm': '0 0 10px rgba(255, 85, 0, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.85, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
