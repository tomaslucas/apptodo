/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#4CAF50',
        danger: '#f44336',
        warning: '#ff9800',
        info: '#2196F3',
        success: '#4CAF50',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
      },
      borderRadius: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'medium': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'large': '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
