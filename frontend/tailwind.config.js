/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        luxury: {
          bg: '#050505',
          surface: '#0F0F0F',
          gold: '#D4AF37',
          'gold-light': '#F3E5AB',
          text: '#FFFFFF',
          muted: '#A3A3A3',
          border: 'rgba(255, 255, 255, 0.1)'
        }
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'serif'],
        body: ['Outfit', 'sans-serif']
      },
      backdropBlur: {
        glass: '24px'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}