/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        docusign: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f6',
          500: '#0e8ce6',
          600: '#026fc4',
          700: '#03589f',
          800: '#074b83',
          900: '#0c3f6e',
          950: '#082849',
        },
        navy: {
          800: '#0e1e38',
          900: '#0a1628',
          950: '#050c17',
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
