/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'casino-green': {
          DEFAULT: '#064e3b',
          dark: '#022c22',
          light: '#047857'
        },
        'casino-gold': '#fbbf24',
        'casino-red': '#dc2626',
        'charcoal': {
          DEFAULT: '#1f2937',
          light: '#374151',
          dark: '#111827'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
