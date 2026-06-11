/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mengu brand
        magenta: {
          50:  '#fce4f3',
          100: '#f9b8e0',
          200: '#f486c9',
          300: '#ef54b3',
          400: '#eb2f9f',
          500: '#E91E8C', // primary brand
          600: '#c41776',
          700: '#9e1260',
          800: '#790d4a',
          900: '#530934',
        },
        navy: {
          50:  '#e8e8f0',
          100: '#c5c5da',
          200: '#9f9fc2',
          300: '#7979ab',
          400: '#5b5b98',
          500: '#3d3d86',
          600: '#2e2e6a',
          700: '#252544', // mid
          800: '#1A1A2E', // primary brand dark
          900: '#0f0f1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
