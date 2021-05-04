module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        night: 'hsla(258, 14%, 20%, 1)',
        accent: 'hsla(341, 81%, 63%, 1)',
        'accent-alt': 'hsla(176, 57%, 58%, 1)',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
