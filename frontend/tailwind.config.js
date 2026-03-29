/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F2937',
        accent: '#10B981',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
