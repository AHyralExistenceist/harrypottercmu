/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hogwarts-red': '#740001',
        'hogwarts-gold': '#D3A625',
        'hogwarts-blue': '#0E1A40',
      },
    },
  },
  plugins: [],
}


