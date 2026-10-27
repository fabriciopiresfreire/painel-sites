/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          600: '#7C3AED',
          500: '#8B5CF6',
          400: '#A78BFA',
        },
        ink: {
          900: '#0B0B12',
          800: '#13131F',
          700: '#1C1C2B',
          600: '#272738',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
