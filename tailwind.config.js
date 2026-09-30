/** @type {import('tailwindcss').Config} */
// The whole colour palette lives here, so the look of the dashboard can be
// adjusted in one place. Names match the Pipeline document.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EA',
        card: '#FDFBF6',
        terracotta: '#C4623F',
        olive: '#6B6B52',
        ink: '#22201C',
        peach: '#F0DBCF',
        sand: '#EEE7DA',
        sage: '#E1E8D8',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Lora', 'Georgia', 'serif'],
        deva: ['"Noto Sans Devanagari"', 'Lora', 'serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(34, 32, 28, 0.06)',
      },
    },
  },
  plugins: [],
}
