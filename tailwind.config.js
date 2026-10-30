/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          dark: '#084C3B',
          light: '#E6F4F0',
          hover: '#0C5A46',
        },
        emergency: {
          DEFAULT: '#E5484D',
          dark: '#B0252A',
          light: '#FEECEE',
          border: '#F87171',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        surface: '#FFFFFF',
        background: '#F4F7F5',
        subtle: '#6B7280',
      },
      maxWidth: {
        'mobile': '430px',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      fontSize: {
        'base': ['16px', '24px'],
      }
    },
  },
  plugins: [],
}
