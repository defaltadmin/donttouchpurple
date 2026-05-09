import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default {
  plugins: [
    autoprefixer({
      // Only add prefixes for browsers that need them
      grid: true,
      flexbox: 'no-2009'
    }),
    // CSS minification
    ...(process.env.NODE_ENV === 'production' ? [
      cssnano({
        preset: ['default', {
          // Optimize for better compression
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          reduceIdents: false, // Keep class names for debugging
          mergeRules: true,
          discardDuplicates: true,
          discardOverridden: true,
          mergeLonghand: true,
        }]
      })
    ] : [])
  ]
};