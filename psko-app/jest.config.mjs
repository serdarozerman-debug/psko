/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Allow importing JSON files
        resolveJsonModule: true,
      },
    }],
  },
  // Don't transform node_modules except what's needed
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
}
