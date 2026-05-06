/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hot: { 50: '#fff1f1', 100: '#ffd7d7', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        warm: { 50: '#fff8e7', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        cool: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' }
      }
    }
  },
  plugins: []
}
