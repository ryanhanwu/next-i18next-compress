module.exports = {
  transform: { '^.+\.tsx?$': '@swc/jest' },
  coverageProvider: 'v8',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  collectCoverageFrom: ['<rootDir>/src/**/*'],
  // Temporarily disable coverage threshold for SWC tests
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Add module resolution for better compatibility
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  // Increase timeout for SWC transformation tests
  testTimeout: 10000,
}
