const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  { ignores: ['node_modules', '.expo', 'coverage', '*.config.js'] },
  ...tseslint.configs.recommended,
  {
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    // Engine must stay pure: no React / RN / non-determinism / network.
    files: ['src/engine/**/*.ts', 'src/utils/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react-native', 'react-native-*', 'expo*', '@ui/*', '@store/*'] }],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Use the injected seeded RNG.' },
        { object: 'Date', property: 'now', message: 'Use the game clock.' },
      ],
      'no-restricted-globals': ['error', 'fetch', 'XMLHttpRequest'],
    },
  },
);
