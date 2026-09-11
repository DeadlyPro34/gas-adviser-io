/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        darkCard: '#131b2e',
        darkBorder: '#1e293b',
        primaryAccent: '#3b82f6',
        secondaryAccent: '#8b5cf6',
        gasLow: '#10b981',
        gasNormal: '#f59e0b',
        gasHigh: '#ef4444',
      },
    },
  },
  plugins: [],
}
