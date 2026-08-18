/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cool gray → navy charcoal neutral scale.
        // 50 = oklch(0.982 0.008 264) — near-white cool gray (page background)
        // 900 = oklch(0.253 0.055 258) — dark navy charcoal (body text)
        ink: {
          50: '#f6f9ff',
          100: '#edf1f8',
          200: '#d9e1ec',
          300: '#b9c5d6',
          400: '#8d9bb1',
          500: '#62718a',
          600: '#485770',
          700: '#364258',
          800: '#28324a',
          900: '#11223c',
          950: '#0a1428',
        },
        // Warm amber/gold accent — premium highlights
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(10 20 40 / 0.06), 0 1px 3px 0 rgb(10 20 40 / 0.1)',
        'card-lg': '0 10px 40px -12px rgb(10 20 40 / 0.25)',
        glow: '0 0 0 1px rgb(245 158 11 / 0.2), 0 8px 30px -8px rgb(245 158 11 / 0.45)',
        'navy-glow': '0 0 0 1px rgb(17 34 60 / 0.2), 0 8px 30px -8px rgb(17 34 60 / 0.4)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)',
        'ink-gradient': 'linear-gradient(160deg, #0a1428 0%, #11223c 55%, #0a1428 100%)',
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
