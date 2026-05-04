/** @type {import('vitest').config} */
module.exports = {
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.js'],
  },
};
