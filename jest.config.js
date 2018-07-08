module.exports = {
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/lib/index.ts',
    '!packages/klay/examples/**/*',
  ],
  transform: {
    '\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/scenarios/',
    '/test/integration/',
  ],
  testMatch: ['**/*.test.ts'],
}
