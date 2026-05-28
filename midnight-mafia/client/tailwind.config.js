/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:   '#F7F0DC',
        ink:     '#1A1410',
        crimson: '#8B1A1A',
        'crimson-light': '#C0392B',
        gold:    '#C9A84C',
        'gold-light': '#E8C96A',
        charcoal: '#2A2318',
      },
      fontFamily: {
        serif:   ['"Playfair Display"', 'serif'],
        script:  ['Sacramento', 'cursive'],
        body:    ['"Cormorant Garamond"', 'serif'],
        mono:    ['"Courier Prime"', 'monospace'],
      },
      boxShadow: {
        card:  '0 16px 50px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
        glow:  '0 0 40px rgba(192,57,43,0.3)',
        'glow-gold': '0 0 30px rgba(201,168,76,0.25)',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease both',
        'card-flip':  'cardFlip 0.75s cubic-bezier(0.4,0,0.2,1) both',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        cardFlip: {
          '0%':   { transform: 'rotateY(90deg) scale(0.85)', opacity: '0' },
          '55%':  { transform: 'rotateY(-5deg) scale(1.03)' },
          '100%': { transform: 'rotateY(0deg) scale(1)',     opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
