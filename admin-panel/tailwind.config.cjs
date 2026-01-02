// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  }
}