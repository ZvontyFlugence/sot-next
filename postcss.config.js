module.exports = {
  plugins: [
    require('postcss-import')(),
    require('tailwindcss')('./tailwindcss.config.js'),
    require('autoprefixer'),
  ]
}
