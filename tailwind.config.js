/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#F8FBFF',
          100: '#F0F6FE',
          200: '#E9EFF7',
          300: '#DFF7FF',
        },
        electric: {
          blue: '#1677FF',
          blueHover: '#0958d9',
          cyan: '#00C9D8',
          cyanDark: '#08979C',
          glow: 'rgba(0, 201, 216, 0.25)',
        },
        midnight: {
          900: '#0B1524',
          800: '#111F35',
          700: '#182B45',
          600: '#263D5C',
          500: '#3D567A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(22, 119, 255, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(0, 201, 216, 0.16)',
        'cyan-glow': '0 0 25px rgba(0, 201, 216, 0.35)',
        'blue-glow': '0 0 25px rgba(22, 119, 255, 0.35)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
