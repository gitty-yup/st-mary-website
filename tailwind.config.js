/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/common/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: 'DM Sans, sans-serif',
        secondary: 'Sora, sans-serif',
        cursive: 'Kaushan Script, cursive',
      },
      textColor: {
        primary: '#002F72',
        secondary: '#FF6634',
        success: '#08A05C',
        error: '#F13637',
        warning: '#FFC107',
        lightGrey: '#A9A9A9',
      },
      backgroundColor: {
        primary: '#002F72',
        secondary: '#FE6534',
        success: '#08A05C',
        error: '#F13637',
        warning: '#FFC107',
      },
      borderColor: {
        primary: '#002F72',
        secondary: '#FE6534',
        error: '#F13637',
        lightGrey: '#A9A9A9',
        success: '#08A05C',
      },
      padding: {
        primary: '6vw',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')({
      target: 'legacy',
    }),
  ],
};
