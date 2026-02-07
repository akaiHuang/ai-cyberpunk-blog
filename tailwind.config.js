/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        display: ['Chakra Petch', 'sans-serif'],
      },
      colors: {
        // 可自訂主題色彩
        primary: '#00FF99',
        secondary: '#FFD700',
        background: '#000000',
        surface: '#0A0A0A',
        border: '#222222',
        text: {
          primary: '#EAEAEA',
          secondary: '#888888',
          muted: '#555555',
        },
      },
    },
  },
  plugins: [],
};
