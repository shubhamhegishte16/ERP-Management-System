/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        surface2: '#1a1a28',
        accent1: '#6c63ff',
        accent2: '#ff5c87',
        accent3: '#00d9a3',
        accent4: '#ffb347',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
