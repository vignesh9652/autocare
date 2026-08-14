/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep charcoal/navy base
        ink: {
          50: '#f6f8fb',
          100: '#e9edf3',
          200: '#d3dbe6',
          300: '#aebbd0',
          400: '#8396b5',
          500: '#64799d',
          600: '#4f6182',
          700: '#414f6a',
          800: '#383f54',
          900: '#1f2437',
          950: '#141725',
        },
        // Confident amber/orange accent
        brand: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#fedbaa',
          300: '#fdc074',
          400: '#fb9c3c',
          500: '#f97d16',
          600: '#ea600c',
          700: '#c2470c',
          800: '#9a3912',
          900: '#7c3012',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.05), 0 1px 3px 0 rgb(16 24 40 / 0.08)',
        'card-lg': '0 10px 40px -12px rgb(16 24 40 / 0.18)',
        glow: '0 0 0 1px rgb(249 125 22 / 0.15), 0 8px 30px -8px rgb(249 125 22 / 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slow-zoom': 'slowZoom 30s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slowZoom: { from: { transform: 'scale(1.05)' }, to: { transform: 'scale(1.18)' } },
      },
    },
  },
  plugins: [],
};
