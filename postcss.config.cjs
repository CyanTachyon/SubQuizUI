// PostCSS configuration aligning CSS transformations with Babel target browsers.
// Browserslist targets are defined in package.json (production/development).
module.exports = {
  plugins: [
    require('postcss-import'),
  // postcss-preset-env includes autoprefixer; we configure grid support here.
    require('postcss-preset-env')({
      stage: 3,
      autoprefixer: { grid: 'autoplace' },
      features: {
        'nesting-rules': true
      }
    }),
  require('postcss-nesting'), // Optional: handles other nesting syntax variants
  ]
};
