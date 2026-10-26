/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rcb: {
          dark: '#0A0B0E',
          charcoal: '#12141A',
          card: '#181A22',
          cardElevated: '#1F222D',
          border: '#2A2E3D',
          borderLight: '#3B4054',
          red: '#D32F2F',
          redBright: '#FF2A42',
          redDark: '#991B1B',
          gold: '#E5B842',
          goldLight: '#F5D061',
          goldDark: '#B8860B',
          text: '#F3F4F6',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        heading: ['"Montserrat"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace']
      },
      boxShadow: {
        'red-glow': '0 0 25px -5px rgba(211, 47, 47, 0.45)',
        'gold-glow': '0 0 20px -5px rgba(229, 184, 66, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
