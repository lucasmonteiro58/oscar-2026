/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        oscar: {
          gold: '#c9a227',
          dark: '#0f0f0f',
          card: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
