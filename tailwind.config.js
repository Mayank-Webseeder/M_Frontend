/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        'bigin-blue': '#093E53',
        'bigin-teal': '#2ABA7B',
        'bigin-light': '#f5f7fa',
        'bigin-gray': '#f0f2f5',
        'bigin-dark': '#2c3e50'
      }
    },
  },
  plugins: [],
};
