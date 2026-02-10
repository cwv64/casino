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
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)',
        'glow-gold-lg': '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4)',
        'glow-green': '0 0 20px rgba(4, 120, 87, 0.6), 0 0 40px rgba(4, 120, 87, 0.3)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.3)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'felt-depth': '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'felt-texture': "url('data:image/svg+xml,%3Csvg width=\"4\" height=\"4\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Crect width=\"1\" height=\"1\" fill=\"rgba(255,255,255,0.02)\" x=\"0\" y=\"0\"/%3E%3Crect width=\"1\" height=\"1\" fill=\"rgba(0,0,0,0.02)\" x=\"2\" y=\"2\"/%3E%3C/svg%3E')",
        'radial-gradient': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
