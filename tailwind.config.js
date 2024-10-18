/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typewriter: {
          'from': { width: '0%' },
          'to': { width: '100%' },
        },
        blinkCursor: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: 'black' },
        },
      },
      animation: {
        shine: 'shine 5s infinite',
        typewriter: 'typewriter 2s steps(30, end) forwards, blinkCursor 0.75s step-end infinite',
      },
    },
  },
  plugins: [],
}