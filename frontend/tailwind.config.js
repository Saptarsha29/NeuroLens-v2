/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#0ea5e9', // cyan-500
        secondary: '#cbd5e1', // slate-300
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        danger: '#fb7185', // rose-400
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
