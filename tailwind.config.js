/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fraoula: {
          bg: '#341539', // Deep Plum
          fg: '#FFFFC5', // Warm Vanilla / Cream
          surface: 'rgba(255, 255, 197, 0.05)',
          surfaceHover: 'rgba(255, 255, 197, 0.1)',
          border: 'rgba(255, 255, 197, 0.2)',
          borderHover: 'rgba(255, 255, 197, 0.45)',
          muted: 'rgba(255, 255, 197, 0.7)',
          dark: '#260d2a',
          darker: '#1d0920',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        signature1: ['"Dancing Script"', 'cursive'],
        signature2: ['"Pacifico"', 'cursive'],
        signature3: ['"Great Vibes"', 'cursive'],
        signature4: ['"Homemade Apple"', 'cursive'],
      }
    },
  },
  plugins: [],
}
