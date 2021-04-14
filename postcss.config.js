module.exports = {
  plugins: [
    require('postcss-import')(),
    require('tailwindcss')('./sot-next/tailwindcss.config.js'),
    require('autoprefixer'),
  ]
}
