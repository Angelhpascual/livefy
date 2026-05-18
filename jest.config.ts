import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/coverage/', '<rootDir>/.vercel/'],
  watchPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/coverage/', '<rootDir>/.vercel/'],
}

export default config
