/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flashCorrect: {
          '0%, 100%': { backgroundColor: 'rgb(6 182 212 / 0.15)' },
          '50%': { backgroundColor: 'rgb(6 182 212 / 0.4)' },
        },
        flashWrong: {
          '0%, 100%': { backgroundColor: 'rgb(239 68 68 / 0.15)' },
          '50%': { backgroundColor: 'rgb(239 68 68 / 0.4)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.25s ease-out',
        flashCorrect: 'flashCorrect 0.4s ease-in-out',
        flashWrong: 'flashWrong 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
