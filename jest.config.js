/** Engine tests run in plain Node (no React Native). UI tests will get a separate project later. */
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true, noUncheckedIndexedAccess: true, esModuleInterop: true }, diagnostics: true }] },
  testMatch: ['<rootDir>/src/engine/**/*.test.ts', '<rootDir>/src/utils/**/*.test.ts', '<rootDir>/src/content/**/*.test.ts', '<rootDir>/src/store/**/*.test.ts'],
  moduleNameMapper: {
    '^@engine/(.*)$': '<rootDir>/src/engine/$1',
    '^@content/(.*)$': '<rootDir>/src/content/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
  },
};
