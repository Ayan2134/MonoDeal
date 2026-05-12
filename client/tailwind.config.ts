import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121417',
        felt: '#0f6b5f',
        brass: '#d8a657',
        'prop-brown': '#8B4513',
        'prop-lightblue': '#87CEEB',
        'prop-pink': '#FF69B4',
        'prop-orange': '#FF8C00',
        'prop-red': '#DC143C',
        'prop-yellow': '#FFD700',
        'prop-green': '#228B22',
        'prop-darkblue': '#00008B',
        'prop-rail': '#2F2F2F',
        'prop-utility': '#A0A0A0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
