/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
    '^.+\\.js$': ['ts-jest', { tsconfig: { module: 'commonjs', allowJs: true } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.route.test.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  // Isolate from node:test files — only *.route.test.ts files are matched
}

module.exports = config
