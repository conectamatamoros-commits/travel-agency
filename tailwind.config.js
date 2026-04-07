/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e8f8',
          200: '#c0d1f0',
          300: '#8aaae3',
          400: '#4d7dd4',
          500: '#1a3a6b',
          600: '#152f58',
          700: '#102445',
          800: '#0b1a32',
          900: '#06101f',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c9a227',
          600: '#b7891a',
          700: '#92640f',
          800: '#78500a',
          900: '#5c3d07',
        },
      },
    },
  },
  plugins: [],
}
