/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/__tests__/**/*.test.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        // Relax strict settings for tests
        strict: false,
        esModuleInterop: true,
      },
    },
  },
  // Mock chrome extension APIs globally
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
};
