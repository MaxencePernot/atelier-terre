/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stoneware palette — grounded in glaze & raw clay, not terracotta.
        paper: '#E9E4DA',      // raw clay off-white (cool greige)
        'paper-deep': '#E0D8CB',
        surface: '#F3EFE7',    // lifted card surface
        ink: '#2A2521',        // warm espresso near-black
        'ink-soft': '#5B5248',
        'ink-faint': '#8B8175',
        celadon: '#6E8E80',    // glaze green — primary accent
        'celadon-deep': '#51705F',
        'celadon-wash': '#DCE3DB',
        ochre: '#B08243',      // kiln ochre — used sparingly
        clay: '#6B4B3A',       // deep clay brown
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid display sizes for the editorial storefront.
        'display-xl': ['clamp(2.75rem, 7vw, 6rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        eyebrow: '0.22em',
      },
      maxWidth: {
        shell: '1240px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(42,37,33,0.04), 0 12px 32px -18px rgba(42,37,33,0.25)',
        lift: '0 2px 4px rgba(42,37,33,0.06), 0 24px 48px -24px rgba(42,37,33,0.35)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease both',
      },
    },
  },
  plugins: [],
}
